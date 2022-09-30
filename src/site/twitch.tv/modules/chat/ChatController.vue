<template>
	<Teleport v-if="extMounted && channel && channel.id" :to="containerEl">
		<div class="seventv-message-container">
			<div v-for="msg of chatStore.messages" :key="msg.id" :msg-id="msg.id">
				<ChatMessage :msg="msg" @open-viewer-card="openViewerCard" />
			</div>
		</div>

		<!-- Custom Scrollbar -->
		<div
			v-if="scroll.visible"
			class="seventv-scrollbar"
			:class="{ 'seventv-scrollbar--visible': scroll.visible }"
			:style="{ height: `${bounds.height}px` }"
		>
			<div
				class="seventv-scrollbar-thumb"
				:style="{
					top: `${containerEl.scrollHeight - containerEl.clientHeight}px`,
				}"
			/>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { getChatController, getChatMessageContainer, Twitch } from "@/site/twitch.tv";
import { ref, reactive, nextTick, onUnmounted, watch } from "vue";
import { useChatStore } from "./ChatStore";
import { registerEmoteCardCardOpener, sendDummyMessage } from "@/site/twitch.tv/modules/chat/ChatBackend";
import { log } from "@/common/Logger";
import { storeToRefs } from "pinia";
import ChatMessage from "@/site/twitch.tv/modules/chat/ChatMessage.vue";

const chatStore = useChatStore();
const { channel } = storeToRefs(chatStore);

const extMounted = ref(false);
const controller = getChatController();
const controllerClass = controller?.constructor?.prototype;

const el = document.createElement("seventv-container");
el.id = "seventv-chat-controller";
const containerEl = ref<HTMLElement>(el);

const bounds = ref<DOMRect>(el.getBoundingClientRect());

log.debug("<ChatController>", "Hook started");

watch(channel, channel => {
	if (!channel) {
		return;
	}

	log.info("<ChatController>", `Joining #${channel.login}`);
});

// Hook chat controller mount event
{
	const x = controllerClass.componentDidUpdate;
	controllerClass.componentDidUpdate = function(this: Twitch.ChatControllerComponent, args: any[]) {
		// Listen for new messages
		this.props.messageHandlerAPI.addMessageHandler(onMessage);

		// Update current channel
		chatStore.setChannel({
			id: this.props.channelID,
			login: this.props.channelLogin,
			displayName: this.props.channelDisplayName,
		});

		// Put placeholder to teleport our message list
		if (document.getElementById("seventv-chat-controller")) {
			return;
		}
		let t = Date.now();

		// Attach to chat
		const parentEl = document.querySelector(".chat-room__content");
		if (parentEl && !parentEl.contains(el)) {
			parentEl.insertBefore(el, parentEl.children[2]);
		}

		// Send dummy message
		sendDummyMessage(this);

		const scrollContainer = document.querySelector(Twitch.Selectors.ChatScrollableContainer);
		if (scrollContainer) {
			const observer = new MutationObserver(entries => {
				for (let i = 0; i < entries.length; i++) {
					const rec = entries[i];

					rec.addedNodes.forEach(node => {
						if (!(node instanceof HTMLElement) || !node.classList.contains("chat-line__message")) {
							return;
						}

						// Finalize all chat hooks
						if (!registerEmoteCardCardOpener()) {
							return;
						}

						overwriteMessageContainer();
						extMounted.value = true;

						log.debug("<ChatController>", "Chat controller mounted", `(${Date.now() - t}ms)`);
						observer.disconnect();
					});
				}
			});

			observer.observe(scrollContainer, {
				childList: true,
			});

			log.debug("<ChatController>", "Spawning MutationObserver");
		}

		return x.apply(this, [args]);
	};
}

// Take over the chat's native message container
const overwriteMessageContainer = () => {
	const container = getChatMessageContainer();
	const containerClass = container.constructor.prototype;
	if (container) {
		containerClass.render = function() {
			return null;
		};
	}
};

// Handle scrolling
const scroll = reactive({
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

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
	scroll.paused = true;
	if (live) {
		scroll.paused = false;
		scroll.init = true;

		chatStore.messages.push(...scroll.buffer);
		scroll.buffer = [];

		nextTick(() => {
			scroll.init = false;
			scrollToLive();
		});
	}
});

const onMessage = (m: Twitch.ChatMessage) => {
	if (m.id === "seventv-hook-message") {
		return;
	}

	const msg = { ...m };

	if (scroll.paused) {
		// if scrolling is paused, buffer the message
		scroll.buffer.push(msg);
		if (scroll.buffer.length > chatStore.lineLimit) scroll.buffer.shift();

		return;
	}

	// Add message to store
	// it will be rendered on the next tick
	chatStore.pushMessage(msg);

	nextTick(() => {
		// autoscroll on new message
		scrollToLive();
	});
};

// Apply new boundaries when the window is resized
const resizeObserver = new ResizeObserver(() => {
	bounds.value = containerEl.value.getBoundingClientRect();
});
resizeObserver.observe(containerEl.value);

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

const openViewerCard = (ev: MouseEvent, viewer: Twitch.ChatUser) => {
	controller.sendMessage(`/user ${viewer.userLogin}`);

	// Watch for card being created
	const userCardContainer = document.querySelector("[data-a-target='chat-user-card']");
	if (!userCardContainer) return;

	const observer = new MutationObserver(() => {
		// Find card element
		const cardEl = document.querySelector<HTMLDivElement>("[data-test-selector='viewer-card-positioner']");
		if (!cardEl) return;

		cardEl.style.top = `${ev.y - cardEl.getBoundingClientRect().height}px`;
		observer.disconnect();
		clearTimeout(timeout);
	});

	observer.observe(userCardContainer, {
		childList: true,
		subtree: true,
	});

	// timeout the mutation observer
	const timeout = setTimeout(() => {
		observer.disconnect();
	}, 30000);
};

onUnmounted(() => {
	resizeObserver.disconnect();
});
</script>

<style lang="scss">
#seventv-chat-controller {
	display: flex;
	flex-direction: column !important;
	-webkit-box-flex: 1 !important;
	flex-grow: 1 !important;
	overflow: auto !important;
	overflow-x: hidden !important;

	.seventv-message-container {
		padding: 1em;
		line-height: 1.5em;
	}

	// Chat padding
	pad &.custom-scrollbar {
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
}

.community-highlight {
	opacity: 0.75;
	backdrop-filter: blur(1em);
}
</style>
