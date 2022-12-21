// REST Helpers
// Fetches initial data from the API

import { log } from "@/common/Logger";
import { convertBttvEmoteSet, convertFFZEmoteSet } from "@/common/Transform";
import { db } from "@/db/IndexedDB";

namespace API_BASE {
	export const SEVENTV = import.meta.env.VITE_APP_API_REST;
	export const BTTV = "https://api.betterttv.net/3";
	export const FFZ = "https://api.frankerfacez.com/v1";
}

export const seventv = {
	async loadUserConnection(platform: Platform, id: string): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(API_BASE.SEVENTV, `users/${platform.toLowerCase()}/${id}`).catch((err) =>
			Promise.reject(err),
		);
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.UserConnection;
		const u = data.user;
		data.user = undefined;

		db.userConnections.put(data).catch(() => {
			db.userConnections.where("id").equals(data.id).modify(data);
		});

		if (u) {
			db.users
				.where("id")
				.equals(u.id)
				.modify(u)
				.catch(() => {
					db.users.add(u).catch((err) => log.error("<Net/Http>", "failed to add user to database", err));
				});
		}

		return Promise.resolve(data);
	},

	async loadGlobalSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.SEVENTV, "emote-sets/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const data = (await resp.json()) as SevenTV.EmoteSet;

		data.provider = "7TV";

		data.name = "7TVSet#GLOBAL";

		db.emoteSets.put(data).catch(() => db.emoteSets.where({ id: data.id, provider: "7TV" }).modify(data));
		return Promise.resolve(data);
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

		const data = convertBttvEmoteSet(bttv_data, channelID);

		db.emoteSets.put(data).catch(() => {
			db.emoteSets.where({ id: data.id, provider: "BTTV" }).modify(data);
		});

		return Promise.resolve(data);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.BTTV, "cached/emotes/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as BTTV.Emote[];

		const set = {
			channelEmotes: bttv_data,
			sharedEmotes: [] as BTTV.Emote[],
			id: "GLOBAL",
		} as BTTV.UserResponse;

		const data = convertBttvEmoteSet(set, set.id);

		db.emoteSets.put(data).catch(() => {
			db.emoteSets.where({ id: "BTTV#GLOBAL", provider: "BTTV" }).modify(data);
		});

		return Promise.resolve(data);
	},
};

export const frankerfacez = {
	async loadUserEmoteSet(channelID: string): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, `room/id/${channelID}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const data = convertFFZEmoteSet(ffz_data, channelID);

		db.emoteSets.put(data).catch(() => {
			db.emoteSets.where({ id: data.id, provider: "FFZ" }).modify(data);
		});

		return Promise.resolve(data);
	},

	async loadGlobalEmoteSet(): Promise<SevenTV.EmoteSet> {
		const resp = await doRequest(API_BASE.FFZ, "set/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const ffz_data = (await resp.json()) as FFZ.RoomResponse;

		const data = convertFFZEmoteSet({ sets: { emoticons: ffz_data.sets["3"] } }, "GLOBAL");

		db.emoteSets.put(data).catch(() => {
			db.emoteSets.where({ id: "FFZ#GLOBAL", provider: "FFZ" }).modify(data);
		});

		return Promise.resolve(data);
	},
};

function doRequest(base: string, path: string): Promise<Response> {
	return fetch(`${base}/${path}`, {});
}
