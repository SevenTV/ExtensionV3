// REST Helpers
// Fetches initial data from API

import { log } from "@/common/Logger";
import { convertBttvEmoteSet, convertFFZEmoteSet } from "@/common/Transform";
import { db } from "@/db/IndexedDB";
import { eventAPI } from "./net.events.worker";
import { getLocal, sendTabNotify } from "./net.worker";

namespace API_BASE {
	export const SEVENTV = import.meta.env.VITE_APP_API_REST;
	export const FFZ = "https://api.frankerfacez.com/v1";
	export const BTTV = "https://api.betterttv.net/3";
}

enum ProviderPriority {
	BTTV,
	FFZ,
	SEVENTV,
	TWITCH,
}

export async function onChannelChange(channel: CurrentChannel) {
	// store the channel into IDB
	await db.withErrorFallback(db.channels.put({ id: channel.id, set_ids: [] }), () =>
		db.channels.where("id").equals(channel.id).modify(channel),
	);

	// setup fetching promises
	const promises = [
		["7TV", seventv.loadUserEmoteSet("TWITCH", channel.id).catch(() => void 0)],
		["FFZ", frankerfacez.loadUserEmoteSet(channel.id).catch(() => void 0)],
		["BTTV", betterttv.loadUserEmoteSet(channel.id).catch(() => void 0)],
	] as [string, Promise<SevenTV.EmoteSet>][];

	const onResult = async (set: SevenTV.EmoteSet) => {
		if (!set) return;

		// store set to DB
		await db.withErrorFallback(db.emoteSets.put(set), () =>
			db.emoteSets.where({ id: set.id, provider: set.provider }).modify(set),
		);

		// add set ID to the channel
		await db.channels
			.where("id")
			.equals(channel.id)
			.modify((x) => x.set_ids.push(set.id));
	};

	// iterate results and store sets to DB
	for (const [provider, setP] of promises) {
		const set = await setP.catch((err) =>
			log.error(`<Net/Http> failed to load emote set from provider ${provider} in #${channel.username}`, err),
		);
		if (!set) continue;

		await onResult(set);
	}

	// notify the UI that the channel is ready
	sendTabNotify(`channel:${channel.id}:ready`);

	// begin subscriptions to channel data
	const cond = {
		ctx: "channel",
		platform: "TWITCH",
		id: channel.id,
	};

	eventAPI.subscribe("entitlement.*", cond);
	eventAPI.subscribe("cosmetic.*", cond);
	eventAPI.subscribe("emote_set.*", cond);
}

export const seventv = {
	async loadUserEmoteSet(platform: Platform, id: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, `users/${platform.toLowerCase()}/${id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.UserConnection;

		const set = structuredClone(data.emote_set) as SevenTV.EmoteSet;
		set.emotes = set.emotes ?? [];
		set.provider = "7TV";
		set.priority = ProviderPriority.SEVENTV;

		data.emote_set = null;

		// subscribe to emote set events
		eventAPI.subscribe("emote_set.*", { object_id: set.id });

		return Promise.resolve(set);
	},

	async loadGlobalSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, "emote-sets/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const set = (await resp.json()) as SevenTV.EmoteSet;

		set.emotes = set.emotes ?? [];
		set.provider = "7TV/G" as SevenTV.Provider;

		// subscribe to events for the global set
		eventAPI.subscribe("emote_set.*", { object_id: set.id });

		db.emoteSets.put(set).catch(() => db.emoteSets.where({ id: set.id, provider: "7TV" }).modify(set));
		return Promise.resolve(set);
	},

	async loadCurrentUser(): Promise<SevenTV.User> {
		const local = getLocal();
		if (!local?.identity) return Promise.reject(new Error("No local identity is defined!"));

		const resp = await doRequest(API_BASE.SEVENTV, `users/twitch/${local.identity.id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const userConn = (await resp.json()) as SevenTV.UserConnection;
		if (!userConn.user) return Promise.reject(new Error("No user was returned!"));

		return Promise.resolve(userConn.user);
	},

	async writePresence(): Promise<void> {
		const local = getLocal();
		if (!local?.user || !local.channel) return;

		doRequest(API_BASE.SEVENTV, `users/${local.user.id}/presences`, "POST", {
			kind: 1,
			data: {
				platform: "TWITCH",
				id: local.channel.id,
			},
		}).then(() => log.info("<Net/Http> Presence sent"));
	},
};

export const frankerfacez = {
	async loadUserEmoteSet(channelID: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, `room/id/${channelID}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const set = convertFFZEmoteSet(ffz_data, channelID);
		set.priority = ProviderPriority.FFZ;

		return Promise.resolve(set);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, "set/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const set = convertFFZEmoteSet({ sets: { emoticons: ffz_data.sets["3"] } }, "GLOBAL");
		set.provider = "FFZ/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: "FFZ" }).modify(set);
		});

		return Promise.resolve(set);
	},
};

export const betterttv = {
	async loadUserEmoteSet(channelID: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.BTTV, `cached/users/twitch/${channelID}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as BTTV.UserResponse;

		const set = convertBttvEmoteSet(bttv_data, channelID);
		set.priority = ProviderPriority.BTTV;

		return Promise.resolve(set);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.BTTV, "cached/emotes/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as BTTV.Emote[];

		const data = {
			channelEmotes: bttv_data,
			sharedEmotes: [] as BTTV.Emote[],
			id: "GLOBAL",
			avatar: "",
		} as BTTV.UserResponse;

		const set = convertBttvEmoteSet(data, data.id);
		set.provider = "BTTV/G" as SevenTV.Provider;

		db.emoteSets.put(set).catch(() => {
			db.emoteSets.where({ id: set.id, provider: "BTTV" }).modify(set);
		});

		return Promise.resolve(set);
	},
};

function doRequest<T = object>(base: string, path: string, method?: string, body?: T): Promise<Response> {
	return fetch(`${base}/${path}`, {
		method,
		body: body ? JSON.stringify(body) : undefined,
		headers: {
			"Content-Type": "application/json",
		},
	});
}
