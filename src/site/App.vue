<template>
	<!-- Spawn Platform-specific Logic -->
	<component v-if="platformComponent" :is="platformComponent" />
</template>

<script setup lang="ts">
import { nanoid } from "nanoid";
import { log } from "@/common/Logger";
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import AppWorker from "@/worker/SharedWorker?sharedworker&inline";

// Detect current platform
const domain = window.location.hostname
	.split(/\./)
	.slice(-2)
	.join(".");

const platformComponent = {
	"twitch.tv": TwitchSite,
}[domain];

log.setContextName(`site/${domain}`);

// Spawn SharedWorker
// This contains the concurrent connection for the Event API
{
	const aw = new AppWorker();

	const id = nanoid(6);
	let state = WebSocket.CONNECTING;
	log.info("<Global>", "Initializing SharedWorker,", `id=${id}`);

	aw.port.start();
}
</script>
