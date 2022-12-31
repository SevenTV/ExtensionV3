import type { WebSocketPayload } from "./events";

export interface WorkerMessage<E, T> {
	source: "SEVENTV";
	type: E;
	to?: string;
	seq?: number;
	data: T;
}

// Networking

export type NetWorkerMessage<T extends NetWorkerMessageType> = WorkerMessage<
	NetWorkerMessageType,
	TypedNetWorkerMessage<T>
> & {
	from: NetWorkerInstance;
};

export enum NetWorkerMessageType {
	INIT = 1, // the tab sends this to its dedicated worker to initialize it
	STATE,
	PING,
	PONG,
	MESSAGE,

	EVENTS_SUB,
	NOTIFY,
}

export type TypedNetWorkerMessage<T extends NetWorkerMessageType> = {
	[NetWorkerMessageType.INIT]: {
		id: number;
	};
	[NetWorkerMessageType.PING]: Record<string, never>;
	[NetWorkerMessageType.PONG]: Record<string, never>;
	[NetWorkerMessageType.STATE]: {
		local?: NetWorkerInstance["local"];
	};
	[NetWorkerMessageType.MESSAGE]: WebSocketPayload<unknown>;
	[NetWorkerMessageType.NOTIFY]: {
		key: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		values?: Record<string, any>;
	};
	[NetWorkerMessageType.EVENTS_SUB]: {
		do: "subscribe" | "unsubscribe";
		type: string;
		condition: Record<string, string>;
	};
}[T];

export interface NetWorkerInstance {
	id: number;
	online: boolean;
	primary: boolean;
	primary_vote?: number;
	local?: {
		platform: Platform;
		identity: TwitchIdentity | YouTubeIdentity | null;
		user: SevenTV.User | null;
		channel?: CurrentChannel;
	};

	_timeout?: number;
}
