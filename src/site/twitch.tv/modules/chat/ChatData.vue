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
	ffz_channel,
	bttv_channel,
	seventv_global,
	ffz_global,
	bttv_global,
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

	[...setMap.map.entries()]
		.sort((a, b) => b[0] - a[0])
		.map((pair) => pair[1])
		.forEach((set) => set.emotes.forEach((emote) => (temp[emote.name] = emote)));
	twitchStore.emoteMap = temp;
});

const id = channel.value?.id ?? "";

// Query Emotes for 7tv channel
liveQuery(() => db.userConnections.where("id").equals(id).first()).subscribe({
	next(conn) {
		if (!conn?.emote_set.emotes) return;
		setMap.map.set(sets.seventv_channel, conn.emote_set);
	},
});

//Query other global and 3rd party emoteSets

useEmoteSetQuery(`FFZ#${id}`, sets.ffz_channel);
useEmoteSetQuery(`BTTV#${id}`, sets.bttv_channel);
useEmoteSetQuery("7TVSet#GLOBAL", sets.seventv_global);
useEmoteSetQuery("FFZ#GLOBAL", sets.ffz_global);
useEmoteSetQuery("BTTV#GLOBAL", sets.bttv_global);

function useEmoteSetQuery(name: string, prio: number): void {
	const ref = liveQuery(() => db.emoteSets.where({ name: name }).first()).subscribe({
		next(conn) {
			if (!conn?.emotes) return;
			setMap.map.set(prio, conn);
			ref.unsubscribe();
		},
	});
}
</script>
