import type { LogType } from "@/common/Logger";

export interface WorkerMessage<T extends WorkerMessageType> {
	type: WorkerMessageType;
	data: TypedWorkerMessage<T>;
}

export enum workerMessageType {
	STATE,
	LOG,
	CLOSE,
	CHANNEL_FETCHED,
}

export type WorkerMessageType = keyof typeof workerMessageType;

export type TypedWorkerMessage<T extends WorkerMessageType> = {
	STATE: Partial<{
		platform: Platform;
		identity: TwitchIdentity | YouTubeIdentity | null;
		user: SevenTV.User | null;
		channel: CurrentChannel | null;
	}>;
	LOG: {
		type: LogType;
		text: string[];
		css: string[];
		objects: object[];
	};
	CLOSE: object;
	CHANNEL_FETCHED: {
		channel: CurrentChannel;
	};
}[T];
