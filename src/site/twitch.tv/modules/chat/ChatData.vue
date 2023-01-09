<template>
	<div />
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { useCosmetics } from "@/composable/useCosmetics";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { useWorker } from "@/composable/useWorker";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import { db } from "@/db/idb";

const { channel, platform } = storeToRefs(useStore());
const { target: workerTarget } = useWorker();
const { setEntitlement } = useCosmetics();
const chatAPI = useChatAPI();

// query the channel's emote set bindings
const channelSets = useLiveQuery(
	() =>
		db.channels
			.where("id")
			.equals(channel.value?.id ?? "")
			.first()
			.then((c) => c?.set_ids ?? []),
	() => {
		// reset the third-party emote providers
		chatAPI.emoteProviders.value["7TV"] = {};
		chatAPI.emoteProviders.value["FFZ"] = {};
		chatAPI.emoteProviders.value["BTTV"] = {};
	},
	{
		reactives: [channel],
	},
);

// query the channel's active emote sets
useLiveQuery(
	() =>
		db.emoteSets
			.where("id")
			.anyOf(channelSets.value ?? [])
			.or("provider")
			.anyOf("7TV/G", "FFZ/G", "BTTV/G")
			.sortBy("priority"),
	(sets) => {
		if (!sets) return;

		for (const set of sets) {
			const provider = (set.provider?.replace("/G", "") ?? "UNKNOWN") as SevenTV.Provider;
			if (!chatAPI.emoteProviders.value[provider]) chatAPI.emoteProviders.value[provider] = {};
			chatAPI.emoteProviders.value[provider][set.id] = set;
		}

		const o = {} as Record<SevenTV.ObjectID, SevenTV.ActiveEmote>;
		for (const emote of sets.flatMap((set) => set.emotes)) {
			if (!emote) return;
			o[emote.name] = emote;
		}

		chatAPI.emoteMap.value = o;
	},
	{
		reactives: [channelSets],
	},
);

// Set up user entitlements

useLiveQuery(
	() =>
		db.entitlements
			.where("scope")
			.equals(`${platform.value}:${channel.value?.id ?? "X"}`)
			.toArray(),
	(ents) => {
		for (const ent of ents) {
			setEntitlement(ent, "+");
		}
	},
);

// Handle user entitlements
workerTarget.addEventListener("entitlement_created", (ev) => {
	setEntitlement(ev.detail, "+");
});

workerTarget.addEventListener("entitlement_deleted", (ev) => {
	setEntitlement(ev.detail, "-");
});
</script>
