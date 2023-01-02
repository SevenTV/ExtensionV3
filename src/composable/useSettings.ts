import { db } from "@/db/IndexedDB";
import { reactive, toRef, watch } from "vue";
import { useLiveQuery } from "./useLiveQuery";

const raw = reactive({} as Record<string, SevenTV.SettingType>);
const settings = reactive({} as Record<string, SevenTV.SettingNode<SevenTV.SettingType>>);
/*

//Initialize
*/

export function useSettings() {
	function get(key: string) {
		if (settings[key]) settings[key];
		return toRef(raw, key);
	}

	function getNodes() {
		return settings;
	}

	function register(nodes: SevenTV.SettingNode<SevenTV.SettingType>[]) {
		for (const node of nodes) {
			settings[node.key] = node;
			if (!raw[node.key]) raw[node.key] = node.defaultValue;
		}
	}

	function init() {
		watch(raw, (newRaw) => {
			db.settings.bulkPut(
				Object.entries(newRaw).map(([key, value]) => {
					return { key: key, type: typeof value, value: value };
				}),
			);
		});
		useLiveQuery(
			() => db.settings.toArray(),
			(settings) => {
				for (const { key, value } of settings) {
					raw[key] = value;
				}
			},
		);
	}

	return {
		get,
		getNodes,
		register,
		init,
	};
}
