// REST Helpers
// Fetches initial data from the API

import { log } from "@/common/Logger";
import { convertBttvUserConnection, convertSeventvGlobalConnection } from "@/common/Transform";
import { db } from "@/db/IndexedDB";

namespace API_BASE {
	export const SEVENTV = import.meta.env.VITE_APP_API_REST;
	export const BTTV = "https://api.betterttv.net/3";
	export const FFZ = "https://api.frankerfacez.com/v1";
}

export const seventv = {
	async loadUserConnection(platform: Platform, id: string): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(API_BASE.SEVENTV ,`users/${platform.toLowerCase()}/${id}`).catch((err) => Promise.reject(err));
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

	async loadGlobalConnection(): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(API_BASE.SEVENTV, "emote-sets/global").catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const set = (await resp.json()) as SevenTV.EmoteSet;
		const data = convertSeventvGlobalConnection(set);

		db.userConnections.put(data).catch(err => {
			db.userConnections.where("id").equals(data.id).modify(data);
		});
		return Promise.resolve(data);
	}
};

export const betterttv = {
	async loadUserConnection(channelID: string): Promise<SevenTV.UserConnection> {
		const resp = await doRequest(API_BASE.BTTV, `cached/users/twitch/${channelID}`).catch((err) => Promise.reject(err));
		if (!resp || resp.status !== 200) {
			return Promise.reject(resp);
		}

		const bttv_data = (await resp.json()) as any;

		const data = convertBttvUserConnection(bttv_data, channelID)

		db.userConnections.put(data).catch(err => {
			db.userConnections.where("id").equals(data.id).modify(data);
		});
		return Promise.resolve(data);
	}
};

function doRequest(base: string, path: string): Promise<Response> {
	return fetch(`${base}/${path}`, {});
};