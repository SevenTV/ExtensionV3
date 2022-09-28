<template>
	<Teleport
		v-if="extMounted"
		to="#seventv-message-list"
		parent=".chat-room__content"
	>
		<div>
			<div v-for="msg of chatStore.messages" :key="msg.id">
				<span>{{ msg.messageBody }}</span>
			</div>
		</div>

		<!-- Custom Scrollbar -->
		<div
			class="seventv-scrollbar"
			:class="{ 'seventv-scrollbar--visible': scroll.visible }"
			:style="{ height: `${bounds.height}px` }"
		>
			<div
				class="seventv-scrollbar-thumb"
				:style="{
					top: `${containerEl.scrollHeight -
						containerEl.clientHeight}px`
				}"
			/>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import {
	getChatController,
	getChatMessageContainer
} from "@/site/twitch.tv/Twitch";
import { ref, reactive } from "vue";
import { useChatStore } from "./ChatStore";

const extMounted = ref(false);
const controller = getChatController();

const el = document.createElement("seventv-container");
el.id = "seventv-message-list";
const containerEl = ref<HTMLElement>(el);
const bounds = ref<DOMRect>(el.getBoundingClientRect());

// Hook chat controller mount event
{
	const x = controller.componentDidUpdate;
	controller.componentDidUpdate = function(args) {
		// Put placeholder to teleport our message list
		if (document.getElementById("#seventv-message-list")) {
			return;
		}

		// Attach to chat
		const parentEl = document.querySelector(".chat-room__content");
		if (parentEl) {
			parentEl.insertBefore(el, parentEl.children[2]);
		}

		extMounted.value = true;

		if (typeof x === "function") x.bind(this, args);
	};
}

const chatStore = useChatStore();

// Handle scrolling
const scroll = reactive({
	init: false,
	sys: true,
	visible: true,
	paused: false
});

containerEl.value.addEventListener("scroll", (ev: Event) => {
	const top = Math.floor(containerEl.value.scrollTop);
	const h = Math.floor(containerEl.value.scrollHeight - bounds.value.height);

	const live = top >= h - 64;

	if (scroll.sys) {
		scroll.sys = false;
		return;
	}

	scroll.paused = true;

	if (live) {
		scroll.paused = false;
	}
});

controller.props.messageHandlerAPI.addMessageHandler(msg => {
	chatStore.pushMessage(msg);

	if (containerEl.value && !scroll.paused) {
		scroll.sys = true;

		containerEl.value.scrollTo({ top: containerEl.value?.scrollHeight });
		bounds.value = containerEl.value.getBoundingClientRect();
	}
});

// Take over the chat's message handler
const container = getChatMessageContainer();
if (container) {
	container.render = function() {
		return null;
	};
}
</script>

<style lang="scss">
#seventv-message-list {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;

	scrollbar-width: none;

	&::-webkit-scrollbar {
		width: 0;
		height: 0;
	}

	.seventv-scrollbar {
		$width: 1em;

		position: absolute;
		right: 0;
		width: $width;
		overflow: hidden;
		border-radius: 0.33em;
		background-color: black;

		> .seventv-scrollbar-thumb {
			position: absolute;
			width: 100%;

			background-color: rgb(77, 77, 77);
		}
	}
}
</style>
