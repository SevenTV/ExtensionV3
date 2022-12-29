<template>
	<Teleport :to="containerEl">
		<div ref="menuRef" class="emote-menu-container" :visible="isVisible">
			<div class="emote-menu">
				<!-- Emote Menu Header -->
				<div class="header">
					<div
						v-for="provider of providers.keys()"
						:key="provider"
						class="provider"
						:selected="provider == selectedProvider"
						@click="selectedProvider = provider"
					>
						<Logo class="logo" :provider="provider" />
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
import Logo from "@/common/Logo.vue";
import EmoteTab from "./EmoteTab.vue";
import { onClickOutside } from "@vueuse/core";

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

const menuRef = ref(null);

function sortEmotes(a: SevenTV.ActiveEmote, b: SevenTV.ActiveEmote) {
	const ra = determineRatio(a);
	const rb = determineRatio(b);
	return ra == rb ? a.name.localeCompare(b.name) : ra > rb ? 1 : -1;
}

function sortSets(a: SevenTV.EmoteSet, b: SevenTV.EmoteSet) {
	// Place global at the bottom
	if (a.provider?.endsWith("/G")) return 1;
	if (b.provider?.endsWith("/G")) return -1;

	// Sort by id ?
	return a.owner?.display_name.localeCompare(b.owner?.display_name ?? "") ?? 0;
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
	() => db.emoteSets.where({ provider: "TWITCH" }).sortBy("id"),
	undefined,
	(sets) => {
		if (!sets) return;

		const temp = {} as Record<string, SevenTV.EmoteSet>;
		for (const set of sets) {
			const name = set.owner?.display_name ?? "Other emotes";
			const cur = temp[name];

			if (!cur) temp[name] = set;
			else cur.emotes.concat(set.emotes).sort(sortEmotes);
		}

		const sorted = Object.entries(temp)
			.sort(([a], [b]) => {
				if (a == "Other emotes") return 1;
				if (b == "Other emotes") return -1;
				return a.localeCompare(b);
			})
			.map(([, s]) => s);

		providers.value.set("TWITCH", sorted);
	},
);

let unsub: () => void;

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(component, "onEmotePickerToggle", function () {
		if (isVisible.value) {
			unsub();
			isVisible.value = false;
			return;
		}

		isVisible.value = true;

		unsub =
			onClickOutside(menuRef, () => {
				isVisible.value = false;
				unsub();
			}) ?? unsub;
	});
});

onUnmounted(() => {
	const component = props.instance.component;

	unsetPropertyHook(component, "onEmotePickerToggle");

	unsub();
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
	background: rgba(217, 217, 217, 3%);
	box-shadow: 0 1px 2px rgb(0 0 0 / 15%);
	border-radius: 0.6rem 0.6rem 0 0;
	justify-content: space-evenly;
}

.provider {
	margin: 0.2rem;
	padding: 0.5rem;
	cursor: pointer;
	display: flex;
	user-select: none;
	justify-content: center;

	&[selected="true"] {
		background: hsla(0deg, 0%, 100%, 16%);
		border-radius: 0.2rem;
	}
}

.logo {
	width: 2rem;
	height: 2rem;
	color: white;
	margin-right: 0.5rem;
}

.body {
	display: flex;
	height: 40rem;

	&[selected="false"] {
		display: none;
	}
}
</style>
