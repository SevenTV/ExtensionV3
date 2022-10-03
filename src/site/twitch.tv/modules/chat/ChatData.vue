<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { liveQuery } from "dexie";
import { reactive, watch } from "vue";
import { useTwitchStore } from "../../TwitchStore";

const twitchStore = useTwitchStore();
const setMap = reactive({
	twitch: [] as SevenTV.EmoteSet[],
});

// watch for changes and remap emotes
watch(setMap, () => {
	for (let i = 0; i < setMap.twitch.length; i++) {
		const set = setMap.twitch[i];

		for (let i2 = 0; i2 < set.emotes.length; i2++) {
			const e = set.emotes[i2];

			twitchStore.emoteMap[e.name] = e;
		}
	}
});

// Query Twitch Emotes
// liveQuery(() =>
// 	db.emoteSets
// 		.where("provider")
// 		.equals("TWITCH")
// 		.toArray(),
// ).subscribe({
// 	next: emoteSets => {
// 		setMap.twitch = emoteSets;
// 	},
// });
</script>
