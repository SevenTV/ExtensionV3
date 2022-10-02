import { TransformWorkerMessage, TransformWorkerMessageType, TypedTransformWorkerMessage } from "@/worker";
import { defineStore } from "pinia";

export interface State {
	platform: Platform;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
	location: Twitch.Location | null;
	workers: {
		net: Worker | null;
		transform: Worker | null;
	};
	workerSeq: number;
}

export interface TwitchIdentity {
	id: string;
	login: string;
	displayName: string;
	color?: string;
}

export interface YouTubeIdentity {
	id: string;
}

export type Platform = "TWITCH" | "YOUTUBE" | "UNKNOWN";

export type PlatformIdentity<T extends Platform> = {
	TWITCH: TwitchIdentity;
	YOUTUBE: YouTubeIdentity;
	UNKNOWN: null;
}[T];

export const useStore = defineStore("main", {
	state: () =>
		({
			platform: "UNKNOWN",
			identity: null,
			location: null,
			workers: {
				net: null,
				transform: null,
				transformSeq: 0,
			},
			workerSeq: 0,
		} as State),

	actions: {
		setIdentity<T extends Platform>(platform: T, identity: PlatformIdentity<T> | null) {
			this.platform = platform;
			this.identity = identity;
		},

		setLocation(location: Twitch.Location | null) {
			this.location = location;
		},

		setWorker(name: keyof State["workers"], worker: Worker | null) {
			this.workers[name] = worker;
		},

		sendTransformRequest<T extends TransformWorkerMessageType>(t: T, data: TypedTransformWorkerMessage<T>): void {
			if (!this.workers.transform) return;
			this.workerSeq++;

			const resp = (ev: MessageEvent) => {
				if (!this.workers.transform) return;
				if (ev.data.seq !== this.workerSeq) return;

				this.workers.transform.removeEventListener("message", resp);
			};

			this.workers.transform.addEventListener("message", resp);

			this.workers.transform.postMessage({
				source: "SEVENTV",
				type: t,
				seq: this.workerSeq,
				data,
			} as TransformWorkerMessage<T>);
		},
	},

	getters: {
		getIdentity<T extends Platform>(state: State) {
			return state.identity as PlatformIdentity<T>;
		},
		getLocation(state: State) {
			return state.location;
		},
	},
});
