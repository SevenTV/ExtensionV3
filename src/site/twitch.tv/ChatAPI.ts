import { nextTick, reactive, Ref, toRefs } from "vue";
import { useEventListener } from "@vueuse/core";

const data = reactive({
	// Message Data
	messages: [] as Twitch.ChatMessage[],
	messageBuffer: [] as Twitch.ChatMessage[],
	emoteMap: {} as Record<string, SevenTV.ActiveEmote>,
	twitchBadgeSets: {} as Twitch.BadgeSets | null,

	// Scroll Data
	userInput: 0,
	lineLimit: 150,
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	scrollBuffer: [] as Twitch.ChatMessage[], // twitch chat message buffe when scrolling is paused
});

let flushTimeout: number | undefined;

export function useChatAPI(container?: Ref<HTMLElement>, bounds?: Ref<DOMRect>) {
	function addMessage(message: Twitch.ChatMessage): void {
		if (data.paused) {
			// if scrolling is paused, buffer the message
			data.scrollBuffer.push(message as Twitch.ChatMessage);
			if (data.scrollBuffer.length > data.lineLimit) data.scrollBuffer.shift();

			return;
		}

		data.messageBuffer.push(message);

		flush();
	}

	function flush(): void {
		if (flushTimeout) return;

		flushTimeout = window.setTimeout(() => {
			if (data.paused) {
				flushTimeout = undefined;
				return;
			}

			data.init = false;

			const overflowLimit = data.lineLimit * 1.25;
			if (data.messages.length > overflowLimit) {
				data.messages.splice(0, data.messages.length - data.lineLimit);
			}

			flushTimeout = window.setTimeout(() => {
				if (data.messageBuffer.length > 0) {
					const unbuf = data.messageBuffer.splice(0, data.messageBuffer.length);

					for (const msg of unbuf) {
						data.messages.push(msg);
					}
				}

				nextTick(() => scrollToLive());

				flushTimeout = undefined;
			}, 25);
		}, 25);
	}

	/**
	 * Scrolls the chat to the bottom
	 */
	function scrollToLive(): void {
		if (!container?.value || !bounds?.value || data.paused) return;

		data.sys = true;

		container.value.scrollTo({
			top: container.value.scrollHeight,
		});

		bounds.value = container.value.getBoundingClientRect();
	}

	/**
	 * Pauses the scrolling of the chat
	 */
	function pauseScrolling(): void {
		data.paused = true;
	}

	/**
	 * Unpauses the scrolling of the chat
	 */
	function unpauseScrolling(): void {
		data.paused = false;
		data.init = true;

		data.messages.push(...data.scrollBuffer);
		data.scrollBuffer.length = 0;

		nextTick(() => {
			data.init = false;
			scrollToLive();
		});
	}

	// Handle system scroll
	if (container && bounds) {
		// Detect User Input
		useEventListener(container, "wheel", () => data.userInput++);

		useEventListener(container, "scroll", () => {
			const top = Math.floor(container.value.scrollTop);
			const h = Math.floor(container.value.scrollHeight - bounds.value.height);

			// Whether or not the scrollbar is at the bottom
			const live = top >= h - 1;

			if (data.init) {
				return;
			}
			if (data.sys) {
				data.sys = false;
				return;
			}

			if (data.userInput > 0) {
				data.userInput = 0;
				pauseScrolling();
			}

			// Check if the user has scrolled back down to live mode
			if (live) {
				unpauseScrolling();
			}
		});
	}

	const { messages, lineLimit, emoteMap, twitchBadgeSets } = toRefs(data);

	return {
		messages: messages,
		lineLimit: lineLimit,
		emoteMap: emoteMap,
		twitchBadgeSets: twitchBadgeSets,
		scroll: data,
		scrollToLive,

		addMessage,
		pauseScrolling,
		unpauseScrolling,
	};
}
