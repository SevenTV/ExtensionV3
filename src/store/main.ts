import { defineStore } from "pinia";

export interface State {
	platform: Platform;
	identity: (TwitchIdentity | YouTubeIdentity) | null;
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
			identity: null
		} as State),

	actions: {
		setIdentity<T extends Platform>(
			platform: T,
			identity: PlatformIdentity<T> | null
		) {
			this.platform = platform;
			this.identity = identity;
		}
	},

	getters: {
		getIdentity<T extends Platform>(state: State) {
			return state.identity as PlatformIdentity<T>;
		}
	}
});
