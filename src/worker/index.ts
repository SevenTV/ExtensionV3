export interface NetworkMessage<T extends NetworkMessageType> {
	source: "SEVENTV";
	type: T;
	from: NetworkWorkerInstance;
	to?: string;
	data: TypedNetworkMessage<T>;
}

export enum NetworkMessageType {
	INIT = 1, // the tab sends this to its dedicated worker to initialize it
	STATE,
	PING,
	PONG,
	MESSAGE,
}

export type TypedNetworkMessage<T extends NetworkMessageType> = {
	[NetworkMessageType.INIT]: {
		id: number;
	};
	[NetworkMessageType.PING]: {};
	[NetworkMessageType.PONG]: {};
	[NetworkMessageType.STATE]: {};
	[NetworkMessageType.MESSAGE]: 0;
}[T];

export interface NetworkWorkerInstance {
	id: number;
	online: boolean;
	primary: boolean;
	primary_vote?: number;

	_timeout?: number;
}
