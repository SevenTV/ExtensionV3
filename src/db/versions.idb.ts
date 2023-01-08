import type { Dexie7 } from "./idb";

export function defineVersions(db: Dexie7) {
	db.version(2.2).stores({
		channels: "id,timestamp",
		emoteSets: "id,timestamp,priority,provider",
		emotes: "id,timestamp,name,owner.id",
		cosmetics: "id,timestamp",
		entitlements: "id,timestamp,user_id",
		settings: "key",
	});
}
