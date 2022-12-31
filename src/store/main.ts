import {
	NetWorkerMessage,
	NetWorkerMessageType,
	TransformWorkerMessage,
	TransformWorkerMessageType,
	TypedNetWorkerMessage,
	TypedTransformWorkerMessage,
} from "@/worker";
import { defineStore } from "pinia";

export interface State {
	platform: Platform;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
	location: Twitch.Location | null;
	channel: CurrentChannel | null;
	workers: {
		net: Worker | null;
		transform: Worker | null;
	};
	workerSeq: number;
}

export const useStore = defineStore("main", {
	state: () =>
		({
			platform: "UNKNOWN",
			identity: null,
			location: null,
			channel: null,
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

		setChannel(channel: CurrentChannel): boolean {
			if (this.channel && this.channel.id === channel.id) {
				return false; // no change.
			}

			this.channel = channel;

			const w = this.workers.net;
			if (w) {
				this.awaitWorkerNotify(`channel:${channel.id}:ready`).then(() => {
					this.channel!.loaded = true;
				});

				w.postMessage({
					source: "SEVENTV",
					type: NetWorkerMessageType.STATE,
					data: {
						local: {
							identity: { ...this.identity },
							platform: this.platform,
							channel: this.channel && this.channel.id ? { ...this.channel } : null,
						},
					},
				} as NetWorkerMessage<NetWorkerMessageType.STATE>);
			}

			return true;
		},

		sendWorkerMessage<T extends NetWorkerMessageType>(type: T, data: TypedNetWorkerMessage<T>) {
			const w = this.workers.net;
			if (!w) return;

			w.postMessage({
				source: "SEVENTV",
				type,
				data,
			} as NetWorkerMessage<T>);
		},

		setWorker(name: keyof State["workers"], worker: Worker | null) {
			this.workers[name] = worker;
		},

		async awaitWorkerNotify(key: string): Promise<void> {
			const w = this.workers.net;
			if (!w) return;

			const p = new Promise<void>((resolve) => {
				const resp = (ev: MessageEvent) => {
					if (ev.data.source !== "SEVENTV") return;
					if (ev.data.type !== NetWorkerMessageType.NOTIFY) return;
					if (ev.data.data.key !== key) return;

					w.removeEventListener("message", resp);
					resolve();
				};

				w.addEventListener("message", resp);
			});

			return p;
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
