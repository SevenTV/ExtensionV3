import { nextTick, reactive, Ref } from "vue";
import { useEventListener, usePointer } from "@vueuse/core";
import { useChatStore } from "@/site/twitch.tv/TwitchStore";

const data = reactive({
	userScroll: false,
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	buffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

export function useChatScroll(container: Ref<HTMLElement>, bounds: Ref<DOMRect>) {
	usePointer({ target: container });

	const chatStore = useChatStore();

	// Detect User Input
	useEventListener(container, "wheel", () => (data.userScroll = true));

	function scrollToLive() {
		if (!container.value || data.paused) {
			return;
		}

		data.sys = true;

		container.value.scrollTo({
			top: container.value.scrollHeight,
		});

		bounds.value = container.value.getBoundingClientRect();
	}

	function pauseScrolling(): void {
		data.paused = true;
	}

	function unpauseScrolling(): void {
		data.paused = false;
		data.init = true;

		chatStore.messages.push(...data.buffer);
		data.buffer.length = 0;

		nextTick(() => {
			data.init = false;
			scrollToLive();
		});
	}

	// Handle system scroll
	useEventListener(container, "scroll", () => {
		const top = Math.floor(container.value.scrollTop);
		const h = Math.floor(container.value.scrollHeight - bounds.value.height);

		// Whether or not the scrollbar is at the bottom
		const live = top >= h - 3;

		if (data.init) {
			return;
		}
		if (data.sys) {
			data.sys = false;
			return;
		}

		if (data.userScroll) {
			pauseScrolling();

			// Check if the user has scrolled back down to live mode
			if (live) {
				unpauseScrolling();
			}
		}
	});

	return {
		scroll: data,
		scrollToLive,
		pauseScrolling,
		unpauseScrolling,
	};
}
