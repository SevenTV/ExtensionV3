import { log } from "@/common/Logger";
import { NetworkMessage, NetworkMessageType, NetworkWorkerInstance, TypedNetworkMessage } from ".";

const w = (self as unknown) as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("NetworkWorker");
log.info("Hello!");

// Set up a BroadcastChannel to communicate with the workers
const bc = new BroadcastChannel("SEVENTV#Network");

const PING_INTERVAL = 10000;
const instances = {} as Record<string, NetworkWorkerInstance>;
const state = {
	id: 0,
	online: false,
	primary: false,
} as NetworkWorkerInstance;

// Listen to messages from the parent tab
w.onmessage = ev => {
	if (ev.data.source !== "SEVENTV") {
		return; // not a message from us
	}

	switch (ev.data.type as NetworkMessageType) {
		// Receive the ID from the tab
		case NetworkMessageType.INIT:
			const msg = ev.data as NetworkMessage<NetworkMessageType.INIT>;
			state.id = msg.data.id;
			state.online = true;

			// Scan the network for other tabs
			instances[state.id] = state;
			broadcastMessage(NetworkMessageType.STATE, {});

			log.debug("Initialized as #" + msg.data.id);
			break;

		default:
			break;
	}
};

self.close = function() {
	state.online = false;
	state.primary = false;

	broadcastMessage(NetworkMessageType.STATE, state);
};

// Listen to global messages
bc.onmessage = ev => {
	if (ev.data.source !== "SEVENTV") return;
	// ignore if "to" is set and it's not us
	if (ev.data.to && ev.data.to !== state.id) return;
	// ignore if "from" is us
	if (ev.data.from.id === state.id) return;

	switch (ev.data.type as NetworkMessageType) {
		case NetworkMessageType.STATE: {
			const msg = ev.data as NetworkMessage<NetworkMessageType.STATE>;

			instances[msg.from.id] = msg.from;

			// Broadcast presence to the network
			if (!msg.to) {
				broadcastMessage(NetworkMessageType.STATE, {}, msg.from.id);
			}

			// Set timeout
			// This instance will be dereferenced if it does not ping
			setInstanceTimeout(msg.from);

			if (msg.from.online) {
				log.debug("<NetworkState>", `Discovered instance #${msg.from.id}`);
			}
		}
		// Another instance asks us if we are still alive
		case NetworkMessageType.PING: {
			const msg = ev.data as NetworkMessage<NetworkMessageType.PING>;

			broadcastMessage(NetworkMessageType.PONG, {}, msg.from.id);
		}
		// Another instance tells us that it is still alive
		case NetworkMessageType.PONG: {
			const msg = ev.data as NetworkMessage<NetworkMessageType.PONG>;

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
	broadcastMessage(NetworkMessageType.PING, {});
}, PING_INTERVAL);

function broadcastMessage<T extends NetworkMessageType>(t: T, data: TypedNetworkMessage<T>, to?: number): void {
	bc.postMessage({
		source: "SEVENTV",
		type: t,
		from: {
			id: state.id,
			online: state.online,
			primary: state.primary,
		} as NetworkWorkerInstance,
		to,
		data,
	});
}

function setInstanceTimeout(inst: NetworkWorkerInstance): void {
	inst._timeout = setTimeout(() => {
		delete instances[inst.id];

		log.debug("<NetworkState>", `#${inst.id} timed out`);
	}, PING_INTERVAL * 1.5);
}
