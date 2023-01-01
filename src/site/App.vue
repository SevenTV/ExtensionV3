<template>
	<!-- Spawn Platform-specific Logic -->
	<template v-if="ok">
		<component :is="platformComponent" v-if="platformComponent" />
	</template>

	<!-- Render tooltip -->
	<div
		id="seventv-tooltip-container"
		ref="tooltipContainer"
		:style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
	>
		<template v-if="typeof tooltip.content === 'string'">
			{{ tooltip.content }}
		</template>
		<template v-else>
			<component :is="tooltip.content" v-bind="tooltip.contentProps" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { Component, markRaw, onMounted, ref } from "vue";
import { log } from "@/common/Logger";
import { tooltip } from "@/composable/useTooltip";
import TwitchSite from "./twitch.tv/TwitchSite.vue";
import { db } from "@/db/IndexedDB";
import { useWorker } from "@/composable/useWorker";

const ok = ref(false);

log.debug("Waiting for IndexedDB...");

db.ready().then(() => {
	log.info("IndexedDB ready");
	ok.value = true;
});

// Spawn SharedWorker
const bc = new BroadcastChannel("SEVENTV#NETWORK");
const { init } = useWorker();
init(bc);

// Detect current platform
const domain = window.location.hostname.split(/\./).slice(-2).join(".");

const platformComponent = ref<Component>();

log.setContextName(`site/${domain}`);

// Tooltip positioning data
const tooltipContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
	if (tooltipContainer.value) {
		tooltip.container = tooltipContainer.value;
	}

	// Define site controller for the platform
	platformComponent.value = {
		"twitch.tv": markRaw(TwitchSite),
	}[domain];
});
</script>

<style lang="scss">
#seventv-root {
	z-index: 1;
}

#seventv-tooltip-container {
	all: unset;
	z-index: 999;
	position: absolute;
	pointer-events: none;
	top: 0;
	left: 0;
}
</style>
