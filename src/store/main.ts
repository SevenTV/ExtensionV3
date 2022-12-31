import { NetWorkerMessage, NetWorkerMessageType, TypedNetWorkerMessage } from "@/worker";
import { defineStore } from "pinia";

export interface State {
	platform: Platform;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
	location: Twitch.Location | null;
	channel: CurrentChannel | null;
	workers: {
		net: Worker | null;
	};
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
				this.awaitWorkerNotify(`channel:${channel.id}:ready`, () => {
					this.channel!.loaded = true;

					return false;
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

		awaitWorkerNotify(key: string, cb: (data?: Record<string, string>) => boolean): void {
			const w = this.workers.net;
			if (!w) return;

			const resp = (ev: MessageEvent) => {
				if (ev.data.source !== "SEVENTV") return true;
				if (ev.data.type !== NetWorkerMessageType.NOTIFY) return true;
				if (ev.data.data.key !== key) return true;

				if (!cb(ev.data.data.values)) {
					w.removeEventListener("message", resp);

					return false;
				}

				return true;
			};

			w.addEventListener("message", resp);
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
