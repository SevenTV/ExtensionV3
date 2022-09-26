<template>
	<div id="app">
		<h1>SEVENTV</h1>
	</div>
	<p>this is a vue app inside of twitch.tv</p>

	<LazyTeleport
		to="[data-test-selector='chat-scrollable-area__message-container']"
		parent="section[data-test-selector='chat-room-component-layout']"
	>
		<MessageList />
	</LazyTeleport>

	<!-- Spawn Platform-specific Logic -->
	<component v-if="platformComponent" :is="platformComponent" />
</template>

<script setup lang="ts">
import LazyTeleport from "@/common/LazyTeleport.vue";
import MessageList from "./twitch.tv/MessageList.vue";
import TwitchSite from "./twitch.tv/TwitchSite.vue";

const domain = window.location.hostname
	.split(/\./)
	.slice(-2)
	.join(".");

const platformComponent = {
	"twitch.tv": TwitchSite
}[domain];

console.log(platformComponent, domain);
</script>
