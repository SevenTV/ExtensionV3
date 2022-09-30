<template>
	<!-- Spawn Platform-specific Logic -->
	<component v-if="platformComponent" :is="platformComponent" />
</template>

<script setup lang="ts">
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import AppWorker from "@/worker/Worker?sharedworker&inline";

const aw = new AppWorker();

aw.port.start();

const domain = window.location.hostname
	.split(/\./)
	.slice(-2)
	.join(".");

const platformComponent = {
	"twitch.tv": TwitchSite,
}[domain];
</script>
