<template>
	<Teleport :to="containerEl">
		<template v-if="visible">
			<div class="emote-menu-container">
				<div class="emote-menu">
					<div class="header">asd</div>
					<div class="body">
						<div class="emote-view">
							<div class="scroll-area">
								<template v-for="(emote, i) in emoteMap" :key="i">
									<ChatEmote :emote="emote" />
								</template>
							</div>
						</div>
						<div class="sidebar"></div>
					</div>
				</div>
			</div>
		</template>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, toRefs } from "vue";
import { HookedInstance } from "@/common/ReactHooks";
import { defineFunctionHook, unsetPropertyHook } from "@/common/Reflection";
import { useChatStore } from "../../TwitchStore";
import ChatEmote from "../chat/components/ChatEmote.vue";

const { emoteMap } = toRefs(useChatStore());

const props = defineProps<{
	instance: HookedInstance<Twitch.ChatInputController>;
}>();

const containerEl = ref<Element>();
containerEl.value = document.querySelector(".chat-input__textarea") ?? undefined;

const visible = ref(false);

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
	width: 100%;
	border-radius: 0.6rem !important;
	background-color: var(--color-background-float) !important;
	box-shadow: var(--shadow-elevation-2) !important;
}

.header {
	height: 4rem;
	width: 100%;
}
.body {
	display: flex;
}

.emote-view {
	display: inline-flex;
	max-height: 30rem;
	width: 100%;
	overflow-y: scroll;
}

.sidebar {
	width: 4rem;
	height: 100%;
}
</style>
