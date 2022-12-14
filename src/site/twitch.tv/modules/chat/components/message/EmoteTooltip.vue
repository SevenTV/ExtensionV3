<template>
	<div ref="tooltip" class="seventv-tooltip" tooltip-type="emote">
		<img ref="imgRef" class="tooltip-emote" :srcset="srcset" :alt="emote.name" />

		<div class="details">
			<h3 class="emote-name">{{ emote.name }}</h3>
			<Logo class="logo" :provider="emote.provider" />
		</div>

		<!-- Alias Labels -->
		<div v-if="emote.data && emote.data.name !== emote.name" class="alias-label">
			aka <span>{{ emote.data?.name }}</span>
		</div>

		<!-- Creator -->
		<div v-if="emote.data?.owner" class="creator-label">
			by
			<span class="creator-name">{{ emote.data.owner.display_name }}</span>
		</div>

		<!-- Labels -->
		<div class="scope-labels">
			<div v-if="isGlobal" class="label-global">Global Emote</div>
			<div v-if="isSubscriber" class="label-subscriber">Subscriber Emote</div>
			<div v-if="isChannel" class="label-channel">Channel Emote</div>
			<div v-if="isPersonal" class="label-personal">Personal Emote</div>
		</div>

		<!-- Zero Width -->
		<div v-if="overlayEmotes.length" class="divider" />
		<div v-if="overlayEmotes.length" class="zero-width-label">
			<template v-for="e of overlayEmotes" :key="e.id">
				<img v-if="e.data" class="overlaid-emote-icon" :srcset="imageHostToSrcset(e.data.host)" />
				—
				<span>{{ e.name }}</span>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { DecimalToStringRGBA } from "@/common/Color";
import { imageHostToSrcset, imageHostToSrcsetWithsize } from "@/common/Image";
import Logo from "@/assets/svg/logos/Logo.vue";

const props = withDefaults(
	defineProps<{
		emote: SevenTV.ActiveEmote;
		unload?: boolean;
		height: number;
		width: number;
	}>(),
	{ unload: false },
);

const srcset = computed(() =>
	props.unload ? "" : imageHostToSrcsetWithsize(props.height, props.width, props.emote.data!.host),
);
const overlayEmotes = computed(() => Object.values(props.emote.overlaid ?? {}));
const width = computed(() => `${props.width * 2}px`);
const height = computed(() => `${props.height * 2}px`);

const isGlobal = computed(() => props.emote.scope === "GLOBAL");
const isSubscriber = computed(() => props.emote.scope === "SUB");
const isChannel = computed(() => props.emote.scope === "CHANNEL");
const isPersonal = computed(() => props.emote.scope === "PERSONAL");

const creatorColor = computed(() => {
	if (!props.emote.data || !props.emote.data.owner) return "inherit";
	if (!props.emote.data.owner.style?.color) return "inherit";

	return DecimalToStringRGBA(props.emote.data.owner.style.color);
});
</script>

<style scoped lang="scss">
.seventv-tooltip {
	display: flex;
	flex-direction: column;
	align-items: center;
	max-width: 21em;
	padding: 0.5em 1.15em;
}

.emote-name {
	font-size: 1.5rem;
	font-weight: 300;
	max-width: 21em;
	word-break: break-all;
	float: left;
}

.logo {
	width: 2rem;
	height: auto;
	float: right;
	flex-shrink: 0;
	align-self: end;
}

img.tooltip-emote {
	margin-bottom: 1rem;
	width: v-bind("width");
	height: v-bind("height");
}

.details {
	display: flex;
	column-gap: 0.5rem;
	flex: 1;

	> h3 {
		font-weight: 600;
	}
}

.divider {
	width: 65%;
	height: 0.01em;
	background-color: currentColor;
	opacity: 0.15;
	margin-top: 0.85rem;
	margin-bottom: 1.25rem;
}

.creator-label {
	font-size: 1.3rem;
	.creator-name {
		color: v-bind("creatorColor");
	}
}

.zero-width-label {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.25rem;
	font-size: 1.3rem;
	font-weight: 600;
	.overlaid-emote-icon {
		width: 1.5rem;
	}
}

.scope-labels {
	font-size: 1.3rem;
	font-weight: 600;
	> .label-global {
		color: rgb(70, 220, 100);
	}

	> .label-personal {
		color: rgb(220, 170, 50);
	}
}
</style>
