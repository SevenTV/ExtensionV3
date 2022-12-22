<template>
	<Teleport v-if="channel && channel.id" :to="containerEl">
		<div id="seventv-message-container" class="seventv-message-container">
			<ChatList :messages="chatStore.messages" />
		</div>

		<!-- Data Logic -->
		<ChatData />

		<!-- New Messages during Scrolling Pause -->
		<div
			v-if="scroll.paused && scroll.buffer.length > 0"
			class="seventv-message-buffer-notice"
			@click="unpauseScrolling"
		>
			<span>{{ scroll.buffer.length }}{{ scroll.buffer.length >= lineLimit ? "+" : "" }} new messages</span>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted, watch, toRef, watchEffect, onMounted } from "vue";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { log } from "@/common/Logger";
import { storeToRefs } from "pinia";
import { useStore } from "@/store/main";
import { getRandomInt } from "@/common/Rand";
import { defineFunctionHook, definePropertyHook } from "@/common/Reflection";
import { defineComponentHook, HookedInstance } from "@/common/ReactHooks";
import ChatData from "./ChatData.vue";
import ChatList from "./ChatList.vue";

const props = defineProps<{
	list: HookedInstance<Twitch.ChatListComponent>;
}>();

const store = useStore();
const chatStore = useTwitchStore();
const { channel } = storeToRefs(store);
const { messages, lineLimit } = storeToRefs(chatStore);

const list = toRef(props, "list");

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";

const containerEl = ref<HTMLElement>(el);
const replacedEl = ref<Element | null>(null);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

watch(channel, (channel) => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.username}`);
});

// Handle scrolling
const scroll = reactive({
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

const dataSets = reactive({
	badges: false,
});

onMounted(async () => {
	// Keep track of props
	definePropertyHook(list.value.component, "props", {
		value(v: typeof list.value.component.props) {
			if (!dataSets.badges) {
				// Find message to grab some data
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const msgItem = (v.children[0] as any | undefined)?.props as Twitch.ChatLineComponent["props"];
				if (!msgItem?.badgeSets?.count) return;

				chatStore.twitchBadgeSets = msgItem.badgeSets;

				dataSets.badges = true;
			}
		},
	});

	// Use chatcontroller to handle resets on channel swaps
	defineComponentHook<Twitch.ChatControllerComponent>(
		{
			parentSelector: ".chat-shell",
			predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,
		},
		{
			hooks: {
				update: (c) => {
					// Update current channel
					const channelUpdated = store.setChannel({
						id: c.component.props.channelID,
						username: c.component.props.channelLogin,
						display_name: c.component.props.channelDisplayName,
					});
					if (!channelUpdated) return;

					messages.value = [];
					scroll.paused = false;
					scroll.buffer.length = 0;
				},
			},
		},
	);
});

watchEffect(() => {
	if (!list.value.domNodes) return;

	const rootNode = list.value.domNodes.root;
	if (!rootNode) return;

	rootNode.classList.add("seventv-chat-list");

	containerEl.value = rootNode as HTMLElement;

	if (!list.value.component?.props?.messageHandlerAPI) return;

	defineFunctionHook(
		list.value.component.props.messageHandlerAPI,
		"handleMessage",
		function (old, msg: Twitch.ChatMessage) {
			const t = Date.now() + getRandomInt(0, 1000);
			const msgData = Object.create({ seventv: true, t });
			for (const k of Object.keys(msg)) {
				msgData[k] = msg[k as keyof Twitch.ChatMessage];
			}

			const ok = onMessage(msgData);
			if (ok) return ""; // message was rendered by the extension

			return old?.call(this, msg);
		},
	);
});

// Take over the chat's native message container
const handledMessageTypes = [0, 2];
const onMessage = (msg: Twitch.ChatMessage): boolean => {
	if (msg.id === "seventv-hook-message" || !handledMessageTypes.includes(msg.type)) {
		return false;
	}

	if (scroll.paused) {
		// if scrolling is paused, buffer the message
		scroll.buffer.push(msg);
		if (scroll.buffer.length > lineLimit.value) scroll.buffer.shift();

		return true;
	}

	// Add message to store
	// it will be rendered on the next tick
	chatStore.pushMessage(msg);

	nextTick(() => {
		// autoscroll on new message
		scrollToLive();
	});

	return true;
};

const scrollToLive = () => {
	if (!containerEl.value || scroll.paused) {
		return;
	}

	scroll.sys = true;

	containerEl.value.scrollTo({
		top: containerEl.value?.scrollHeight,
	});
	bounds.value = containerEl.value.getBoundingClientRect();
};

function unpauseScrolling(): void {
	scroll.paused = false;
	scroll.init = true;

	chatStore.messages.push(...scroll.buffer);
	scroll.buffer.length = 0;

	nextTick(() => {
		scroll.init = false;
		scrollToLive();
	});
}

function pauseScrolling(): void {
	scroll.paused = true;
}

// Listen for scroll events
containerEl.value.addEventListener("scroll", () => {
	const top = Math.floor(containerEl.value.scrollTop);
	const h = Math.floor(containerEl.value.scrollHeight - bounds.value.height);

	// Whether or not the scrollbar is at the bottom
	const live = top >= h - 3;

	if (scroll.init) {
		return;
	}
	if (scroll.sys) {
		scroll.sys = false;
		return;
	}

	// Check if the user has scrolled back down to live mode
	pauseScrolling();
	if (live) {
		unpauseScrolling();
	}
});

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

onUnmounted(() => {
	resizeObserver.disconnect();

	el.remove();
	if (replacedEl.value) replacedEl.value.classList.remove("seventv-checked");

	log.debug("<ChatController> Unmounted");
});
</script>

<style lang="scss">
seventv-container.seventv-chat-list {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;
	overflow-x: hidden !important;

	.seventv-message-container {
		padding-bottom: 1em;
		line-height: 1.5em;
	}

	// Chat padding
	&.custom-scrollbar {
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

	.seventv-message-buffer-notice {
		cursor: pointer;
		position: absolute;
		bottom: 8em;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5em;
		border-radius: 0.33em;
		color: #fff;
		background-color: rgba(0, 0, 0, 0.5%);
		backdrop-filter: blur(0.05em);
	}
}

.community-highlight {
	opacity: 0.75;
	backdrop-filter: blur(1em);
}

.chat-list--default.seventv-checked {
	display: none !important;
}
</style>
