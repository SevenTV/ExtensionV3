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
}

export type TypedNetWorkerMessage<T extends NetWorkerMessageType> = {
	[NetWorkerMessageType.INIT]: {
		id: number;
	};
	[NetWorkerMessageType.PING]: {};
	[NetWorkerMessageType.PONG]: {};
	[NetWorkerMessageType.STATE]: {};
	[NetWorkerMessageType.MESSAGE]: 0;
}[T];

export interface NetWorkerInstance {
	id: number;
	online: boolean;
	primary: boolean;
	primary_vote?: number;

	_timeout?: number;
}

// Transform
export type TransformWorkerMessage<T extends TransformWorkerMessageType> = WorkerMessage<
	TransformWorkerMessageType,
	TypedTransformWorkerMessage<T>
>;

export enum TransformWorkerMessageType {
	TWITCH_EMOTES = 1,
}

export type TypedTransformWorkerMessage<T extends TransformWorkerMessageType> = {
	[TransformWorkerMessageType.TWITCH_EMOTES]: {
		input?: Twitch.TwitchEmoteSet[];
		output?: SevenTV.Emote[];
	};
}[T];
