<template>
	<Teleport :to="containerEl">
		<template v-if="visible">
			<div class="emote-menu-container">
				<div class="emote-menu">
					<div class="header">
						<div
							v-for="(e, provider) of filteredEmoteMaps"
							:key="provider"
							class="provider-icon"
							:class="{ active: provider == active }"
							@click="active = provider"
						>
							{{ provider }}
						</div>
					</div>
					<template v-for="(emoteSet, provider) of filteredEmoteMaps" :key="provider">
						<template v-if="active == provider">
							<div class="body">
								<div class="scroll-area">
									<div class="emote-area">
										<template v-for="(emote, code) in emoteSet" :key="code">
											<div class="emote-container" :class="`ratio-${determineRatio(emote)}`">
												<ChatEmote :emote="emote" />
											</div>
										</template>
									</div>
								</div>
								<div class="sidebar"></div>
							</div>
						</template>
					</template>
				</div>
			</div>
		</template>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { useChatAPI } from "../../ChatAPI";
import ChatEmote from "../chat/components/ChatEmote.vue";

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const containerEl = ref<Element>();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const visible = ref(false);

const filteredEmoteMaps = ref({} as Record<SevenTV.Provider, Record<string, SevenTV.ActiveEmote>>);

watch(useChatAPI().emoteMap, (emoteMap) => {
	const temp = {} as Record<SevenTV.Provider, Record<string, SevenTV.ActiveEmote>>;
	for (const emote of Object.values(emoteMap)) {
		const provider = emote.provider ?? "7TV";
		if (!temp[provider]) temp[provider] = {};
		temp[provider][emote.name] = emote;
	}
	filteredEmoteMaps.value = temp;
});

const active = ref("7TV" as SevenTV.Provider);

function determineRatio(emote: SevenTV.ActiveEmote) {
	const { width, height } = emote.data?.host.files.at(-1) ?? {};

	if (!width || !height) return 1;

	const ratio = width / height;

	if (ratio <= 1) return 1;
	else if (ratio <= 2) return 2;
	return 3;
}

onMounted(() => {
	const component = props.instance.component;

	defineFunctionHook(component, "onEmotePickerToggle", function () {
		visible.value = !visible.value;
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
}

.emote-menu {
	width: 32rem;
	border-radius: 0.6rem !important;
	background-color: #18181b;
	box-shadow: var(--shadow-elevation-2) !important;
}

.header {
	display: flex;
}

.active {
	background: hsla(0, 0%, 100%, 0.16);
}

.body {
	display: flex;
	height: 30em;
}

.provider-icon {
	margin: 1em 0.2em;
}

.scroll-area {
	width: 100%;
	overflow-y: scroll;
}

.emote-area {
	display: inline-flex;
	flex-wrap: wrap;
}

.emote-container {
	display: grid;
	background: #252528;
	border-radius: 0.5rem;
	height: 4rem;
	margin: 0.25rem;

	&:hover {
		background: hsla(0, 0%, 100%, 0.16);
	}
}

.ratio-1 {
	width: 4rem;
}

.ratio-2 {
	width: 8.5rem;
}

.ratio-3 {
	width: 13rem;
}

.sidebar {
	// width: 4rem;
	height: 100%;
}
</style>
