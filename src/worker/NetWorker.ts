import { log } from "@/common/Logger";
import { NetWorkerMessageType, NetWorkerInstance, TypedNetWorkerMessage, NetWorkerMessage } from ".";

const w = (self as unknown) as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("NetWorker");

// Set up a BroadcastChannel to communicate with the workers
const bc = new BroadcastChannel("SEVENTV#Network");

const PING_INTERVAL = 6000;
const instances = {} as Record<string, NetWorkerInstance>;
const state = {
	id: 0,
	online: false,
	primary: false,
} as NetWorkerInstance;

// Listen to global messages
let electionTimeout = 0;

// Listen to messages from the parent tab
w.onmessage = ev => {
	if (ev.data.source !== "SEVENTV") {
		return; // not a message from us
	}

	switch (ev.data.type as NetWorkerMessageType) {
		// Receive the ID from the tab
		case NetWorkerMessageType.INIT:
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.INIT>;
			state.id = msg.data.id;
			state.online = true;

			// Scan the network for other tabs
			instances[state.id] = state;

			// If no other tabs are found, we will become the primary
			electionTimeout = setTimeout(runPrimaryElection, 1000);

			broadcastMessage(NetWorkerMessageType.STATE, {});

			log.debug("Initialized as #" + msg.data.id);
			break;

		default:
			break;
	}
};

bc.onmessage = ev => {
	if (ev.data.source !== "SEVENTV") return;
	// ignore if "to" is set and it's not us
	if (ev.data.to && ev.data.to !== state.id) return;
	// ignore if "from" is us
	if (ev.data.from.id === state.id) return;

	switch (ev.data.type as NetWorkerMessageType) {
		case NetWorkerMessageType.STATE: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.STATE>;

			const exists = !!instances[msg.from.id];

			if (!exists && msg.from.online) {
				instances[msg.from.id] = msg.from;

				// Broadcast presence to the network
				if (!msg.to) {
					broadcastMessage(NetWorkerMessageType.STATE, {}, msg.from.id);
				}

				// Set timeout
				// This instance will be dereferenced if it does not ping
				setInstanceTimeout(msg.from);

				log.debug("<NetworkState>", `#${msg.from.id}`, "joined");
			} else {
				const inst = instances[msg.from.id];

				inst.primary = msg.from.primary;
				inst.online = msg.from.online;
				inst.primary_vote = msg.from.primary_vote;

				if (inst.primary) {
					log.debug("<NetworkState>", `#${msg.from.id}`, "elected as primary");
				}
			}

			// after a second without new state updates,
			// we will run a primary election
			clearInterval(electionTimeout);
			electionTimeout = setTimeout(runPrimaryElection, 1000);
		}
		// Another instance asks us if we are still alive
		case NetWorkerMessageType.PING: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.PING>;

			broadcastMessage(NetWorkerMessageType.PONG, {}, msg.from.id);
		}
		// Another instance tells us that it is still alive
		case NetWorkerMessageType.PONG: {
			const msg = ev.data as NetWorkerMessage<NetWorkerMessageType.PONG>;

			// Reset timeout
			const inst = instances[msg.from.id];
			if (!inst) return; // instance not stored

			clearTimeout(inst._timeout);
			setInstanceTimeout(inst);
		}
		default:
			break;
	}
};

// Set up pinging
setInterval(() => {
	broadcastMessage(NetWorkerMessageType.PING, {});
}, PING_INTERVAL);

function runPrimaryElection(): void {
	const instanceList = Object.values(instances);
	// There is only one instance, so it is the primary
	if (instanceList.length === 1) {
		becomePrimary();

		return;
	}

	const primaryExists = Object.values(instances).some(i => i.primary);
	if (!primaryExists) {
		// Tally votes
		const votes = instanceList.filter(i => typeof i.primary_vote === "number").map(i => i.primary_vote as number);
		if (votes.length === instanceList.length) {
			// all the votes are in. we can now elect a primary
			const primary = instanceList.find(i => i.primary_vote === Math.max(...votes));
			if (!primary || primary.id !== state.id) return;

			// if we are the primary, declare our authority status to the network
			becomePrimary();

			return;
		}

		// Pick the highest ID as the favored to become primary
		const highest = instanceList.reduce((a, b) => (a.id > b.id ? a : b), state);
		state.primary_vote = highest.id;

		// Cast our vote
		broadcastMessage(NetWorkerMessageType.STATE, {});
	}
}

function becomePrimary(): void {
	state.primary = true;

	// Connect to the WebSocket

	broadcastMessage(NetWorkerMessageType.STATE, {});
	log.debug("<NetworkState>", "Elected as primary");
}

function broadcastMessage<T extends NetWorkerMessageType>(t: T, data: TypedNetWorkerMessage<T>, to?: number): void {
	bc.postMessage({
		source: "SEVENTV",
		type: t,
		from: {
			id: state.id,
			online: state.online,
			primary: state.primary,
			primary_vote: state.primary_vote,
		} as NetWorkerInstance,
		to,
		data,
	});
}

function setInstanceTimeout(inst: NetWorkerInstance): void {
	inst._timeout = setTimeout(() => {
		delete instances[inst.id];

		log.debug("<NetworkState>", `#${inst.id} timed out`);

		// Primary has quit, we must elect a new one
		const primaryExists = Object.values(instances).some(i => i.primary);
		if (!primaryExists) {
			log.debug("<NetworkState>", `#${inst.id} was primary, but has quit. Running primary election.`);
			runPrimaryElection();
		}
	}, PING_INTERVAL * 1.5);
}
