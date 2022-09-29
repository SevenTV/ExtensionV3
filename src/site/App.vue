<template>
	<!-- Spawn Platform-specific Logic -->
	<component v-if="platformComponent" :is="platformComponent" />
</template>

<script setup lang="ts">
import TwitchSite from "./twitch.tv/TwitchSite.vue";

const domain = window.location.hostname.split(/\./).slice(-2).join(".");

const platformComponent = {
	"twitch.tv": TwitchSite,
}[domain];
</script>
