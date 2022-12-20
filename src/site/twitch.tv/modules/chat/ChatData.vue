<script setup lang="ts">
import { db } from "@/db/IndexedDB";
import { useStore } from "@/store/main";
import { liveQuery } from "dexie";
import { storeToRefs } from "pinia";
import { reactive, watch } from "vue";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";

// This defines the priority of emotes in the emoteMap assuming all are present
enum sets {
	seventv_channel = 1,
	seventv_global,
	ffz_channel,
	ffz_global,
	betterttv_channel,
	betterttv_global,
}

const { channel } = storeToRefs(useStore());
const twitchStore = useTwitchStore();
const setMap = reactive({
	map: new Map<sets, SevenTV.EmoteSet>(),
});

// watch for changes and remap emotes
watch(setMap, () => {

	// Using temp to only fire one update
	const temp = {} as Record<string, SevenTV.ActiveEmote>;

	const test = [...setMap.map.entries()]
		.sort((a, b) => b[0] - a[0])
		.map(pair => pair[1])
		.forEach(set => 
			set.emotes.forEach(emote => 
				temp[emote.name] = emote
			)
		)
	twitchStore.emoteMap = temp;
});

const id = channel.value!.id

// Query Emotes for 7tv channel
liveQuery(() =>
	db.userConnections
		.where("id")
		.equals(id)
		.first(),
).subscribe({
	next(conn) {
		if (!conn) return;
		setMap.map.set(sets.seventv_channel, conn.emote_set) 
	},
});

//Query other global and 3rd party emoteSets
liveQuery(() => 
	db.emoteSets
		.where("name")
		.anyOf([
			`7TVSet#GLOBAL`,
			`BttvSet#GLOBAL`,
			`BttvSet#${id}`,
			`FFZSet#GLOBAL`,
			`FFZSet#${id}`,
		])
).subscribe({
	next(conns) {
		let i = 2;
		conns.each(conn => {
			setMap.map.set(i, conn)
			i++;
		})
	}
});

(window as any).db = db;

</script>
