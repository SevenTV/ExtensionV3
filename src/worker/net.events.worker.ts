// EventAPI - WebSocket
// Keeps our data state up to date

import { log } from "@/common/Logger";
import { getRandomInt } from "@/common/Rand";
import { db } from "@/db/IndexedDB";
import { NetWorkerMessageType } from ".";
import { handleDispatchedEvent } from "./event-handlers/handler";
import { EventContext, Payload, SubscriptionData, WebSocketPayload } from "./events";
import { isPrimary, primaryExists, sendToPrimary } from "./net.worker";

export class EventAPI {
	private transport: EventAPITransport = "WebSocket";
	private sessionID = "";
	private heartbeatInterval: number | null = null;
	private backoff = 100;
	private ctx: EventContext;

	subscriptions: Record<string, SubscriptionRecord[]> = {};

	url = import.meta.env.VITE_APP_API_EVENTS;
	private socket: WebSocket | null = null;
	private eventSource: EventSource | null = null;

	constructor() {
		this.ctx = {
			db: db,
			eventAPI: this,
		};
	}

	connect(): void {
		if (this.socket || !this.url) return;

		this.socket = new WebSocket(this.url);
		this.socket.onopen = () => this.onOpen();
		this.socket.onclose = () => this.onClose();

		log.debug("<Net/EventAPI>", "Connecting to the EventAPI...", `url=${this.url}`);
	}

	getSocket(): WebSocket | null {
		return this.socket;
	}
	private onMessage(msg: WebSocketPayload<unknown>): void {
		switch (msg.op) {
			case EventOpCode.HELLO:
				this.onHello(msg as WebSocketPayload<Payload.Hello>);
				break;
			case EventOpCode.DISPATCH:
				this.onDispatch(msg as WebSocketPayload<Payload.Dispatch>);
				break;
			case EventOpCode.ACK:
				this.onAck(msg as WebSocketPayload<Payload.Ack<unknown>>);
				break;

			default:
				break;
		}
	}

	private onOpen(): void {
		log.info("<Net/EventAPI>", "Connected", `url=${this.url}`);
	}

	private onHello(msg: WebSocketPayload<Payload.Hello>): void {
		this.sessionID = msg.d.session_id;
		this.heartbeatInterval = msg.d.heartbeat_interval;
	}

	private onDispatch(msg: WebSocketPayload<Payload.Dispatch>): void {
		handleDispatchedEvent(this.ctx, msg.d.type, msg.d.body);
	}

	private onAck(msg: WebSocketPayload<Payload.Ack<unknown>>): void {
		switch (msg.d.command) {
			case "SUBSCRIBE": {
				const d = msg.d as Payload.Ack<SubscriptionData>;

				const sub = this.getSubscription(d.data.type, d.data.condition);
				if (sub) {
					sub.count++;
					break;
				}

				if (!Array.isArray(this.subscriptions[d.data.type])) {
					this.subscriptions[d.data.type] = [];
				}

				this.subscriptions[d.data.type].push({
					condition: d.data.condition,
					count: 1,
				});
				break;
			}
		}
	}

	subscribe(type: string, condition: Record<string, string>) {
		const msg = {
			op: EventOpCode.SUBSCRIBE,
			d: {
				type,
				condition,
			},
		};

		this.sendMessage(msg);
	}

	getSubscription(type: string, condition: Record<string, string>): SubscriptionRecord | null {
		const sub = this.subscriptions[type];
		if (!sub) return null;

		return sub.find((c) => Object.entries(condition).every(([key, value]) => c.condition[key] === value)) ?? null;
	}

	sendMessage(msg: WebSocketPayload<unknown>): void {
		// retry if we're no primary has been selected or the socket isn't ready
		if (!primaryExists() || (isPrimary() && !this.socket)) {
			setTimeout(() => this.sendMessage(msg), 100);
			return;
		}

		// if we are not primary, delegate this to the primary
		if (!isPrimary()) {
			sendToPrimary(NetWorkerMessageType.MESSAGE, msg);
		}

		log.debug("<Net/EventAPI>", "Sending message with op:", msg.op.toString());

		if (!this.socket) return;

		// Ensure correct subscription behavior
		if (msg.op === EventOpCode.SUBSCRIBE || msg.op === EventOpCode.UNSUBSCRIBE) {
			const d = msg.d as SubscriptionData;
			const sub = this.getSubscription(d.type, d.condition);
			if (msg.op === EventOpCode.SUBSCRIBE && sub) {
				return;
			} else if (msg.op === EventOpCode.UNSUBSCRIBE && !sub) {
				return;
			}
		}

		this.socket.send(JSON.stringify(msg));
	}

	pushMessage(msg: WebSocketPayload<unknown>): void {
		if (msg.op >= 32) {
			this.sendMessage(msg);

			return;
		}

		this.onMessage(msg);
	}

	private onClose(): void {
		this.socket = null;
		const n = this.reconnect();

		log.debug("<Net/EventAPI>", "Disconnected", `url=${this.url}, reconnect=${n}`);
	}

	reconnect(): number {
		const jitter = Math.min((this.backoff += getRandomInt(1000, 5000)), 120000);

		setTimeout(() => {
			if (this.socket) return;

			this.connect();
		}, jitter);
		return jitter;
	}

	disconnect(): void {
		if (!this.socket) return;

		this.socket.close(1000);
		this.socket = null;
	}
}

export const eventAPI = new EventAPI();

enum EventOpCode {
	DISPATCH = 0,
	HELLO = 1,
	HEARTBEAT = 2,
	RECONNECT = 4,
	ACK = 5,
	ERROR = 6,
	ENDOFSTREAM = 7,
	IDENTIFY = 33,
	RESUME = 34,
	SUBSCRIBE = 35,
	UNSUBSCRIBE = 36,
	SIGNAL = 37,
}

interface SubscriptionRecord {
	condition: Record<string, string>;
	count: number;
}

type EventAPITransport = "WebSocket" | "EventStream";
