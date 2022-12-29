<template>
	<Teleport :to="containerEl">
		<div class="emote-menu-container" :visible="isVisible">
			<div class="emote-menu">
				<!-- Emote Menu Header -->
				<div class="header">
					<div
						v-for="provider of providers.keys()"
						:key="provider"
						class="provider-icon"
						:selected="provider == selectedProvider"
						@click="selectedProvider = provider"
					>
						{{ provider }}
					</div>
				</div>
				<!-- Emote menu body -->
				<template v-for="[provider, emoteSets] of providers" :key="provider">
					<div class="body" :selected="provider == selectedProvider">
						<EmoteTab :emote-sets="emoteSets" :input-controller="instance.component" />
					</div>
				</template>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { useChatAPI } from "../../ChatAPI";
import { determineRatio } from "./EmoteMenuBackend";
import { useLiveQuery } from "@/composable/useLiveQuery";
import { db } from "@/db/IndexedDB";
import EmoteTab from "./EmoteTab.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const containerEl = ref<Element>();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const isVisible = ref(false);
const selectedProvider = ref("TWITCH" as SevenTV.Provider);

const providers = ref(new Map<SevenTV.Provider, SevenTV.EmoteSet[]>());

providers.value.set("TWITCH", []);
providers.value.set("7TV", []);
providers.value.set("FFZ", []);
providers.value.set("BTTV", []);

function sortEmotes(a: SevenTV.ActiveEmote, b: SevenTV.ActiveEmote) {
	const ra = determineRatio(a);
	const rb = determineRatio(b);
	return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
}

function sortSets(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	// Place global at the bottom
	if (b.id.endsWith("/G")) return 1;

	// Place personals? at top;
	if (a.id.endsWith("/P")) return 1;

	// Sort by id ?
	return a.id.localeCompare(b.id);
}

watch(useChatAPI().emoteProviders, (emoteProvider) => {
	for (const [p, sets] of Object.entries(emoteProvider)) {
		const sorted = Object.values(sets)
			.sort(sortSets)
			.map((s) => {
				s.emotes.sort(sortEmotes);
				return s;
			});
		providers.value.set(p as SevenTV.Provider, sorted);
	}
});

useLiveQuery(
	() => db.emoteSets.where({ provider: "TWITCH" }).sortBy("name"),
	undefined,
	(sets) => {
		if (!sets) return;

		const g = sets.shift();
		if (g) sets.push(g);

		providers.value.set("TWITCH", sets);
	},
);

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(component, "onEmotePickerToggle", function () {
		isVisible.value = !isVisible.value;
	});
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEmotePickerToggle");
});
</script>

<style scoped lang="scss">
.emote-menu-container {
	position: absolute;
	inset: auto 0 100% auto;
	max-width: 100%;

	&[visible="false"] {
		display: none;
	}
}

.emote-menu {
	width: 32rem;
	border-radius: 0.6rem !important;
	background-color: #18181b;
	box-shadow: var(--shadow-elevation-2) !important;
}

.header {
	display: flex;
	justify-content: space-evenly;
	box-shadow: 0 1px 2px black;
	background: rgba(217, 217, 217, 3%);
	border-radius: 0.6rem 0.6rem 0 0;
}

.provider-icon {
	margin: 0.5rem;
	padding: 1rem;
	cursor: pointer;
	user-select: none;
	box-shadow: inset 0 1px 1px black;

	&[selected="true"] {
		background: hsla(0deg, 0%, 100%, 16%);
		box-shadow: 1px 1px 4px black;
		border-radius: 0.2rem;
	}
}

.body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}
</style>
