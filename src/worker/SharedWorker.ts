import { log } from "@/common/Logger";

const sw = (self as unknown) as SharedWorkerGlobalScope;

declare let onconnect: (e: MessageEvent) => void;

// Set up logger
log.setContextName("SharedWorker");

// Set up a BroadcastChannel to communicate with the workers
const bc = new BroadcastChannel("SEVENTV#WebSocket");

const portMap = {} as Record<number, MessagePort>;

sw.addEventListener("connect", e => {
	// Retrieve communication port to the tab
	const port = e.ports[0];

	port.addEventListener("message", msg => {});
});

export interface SharedMessage<T = any> {
	Type: SharedMessageType;
	Data: T;
}

export type TypedSharedMessage<T extends SharedMessageType> = {
	[SharedMessageType.State]: number;
	[SharedMessageType.Message]: 0;
}[T];

export enum SharedMessageType {
	State = 1,
	Message,
}
