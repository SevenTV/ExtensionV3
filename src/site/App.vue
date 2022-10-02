<template>
	<!-- Spawn Platform-specific Logic -->
	<component v-if="platformComponent" :is="platformComponent" />
</template>

<script setup lang="ts">
import { log } from "@/common/Logger";
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import { NetworkMessage, NetworkMessageType } from "@/worker";
import NetworkWorker from "@/worker/NetWorker?worker&inline";

// Spawn NetworkWorker
// This contains the connection for the Event API
{
	const nw = new NetworkWorker();
	const id = Math.floor(Math.random() * Math.pow(2, 15));
	log.info("<Global>", "Initializing WebSocket,", `id=${id}`);

	nw.postMessage({
		source: "SEVENTV",
		type: NetworkMessageType.INIT,
		data: { id },
	} as NetworkMessage<NetworkMessageType.INIT>);
}

// Detect current platform
const domain = window.location.hostname
	.split(/\./)
	.slice(-2)
	.join(".");

const platformComponent = {
	"twitch.tv": TwitchSite,
}[domain];

log.setContextName(`site/${domain}`);
</script>
