import { Ref, nextTick, reactive, ref, toRefs, watchEffect } from "vue";
import { useConfig } from "@/composable/useSettings";
import UiScrollableVue from "@/ui/UiScrollable.vue";

const scrollduration = useConfig<number>("chat.smooth_scroll_duration");
const lineLimit = useConfig<number>("chat.line_limit");

const data = reactive({
	// Message Data
	messages: [] as Twitch.DisplayableMessage[],
	messageBuffer: [] as Twitch.DisplayableMessage[],
	chatters: {} as Record<string, object>,

	// Emote Data
	emoteMap: {} as Record<string, SevenTV.ActiveEmote>,
	emoteProviders: {} as Record<SevenTV.Provider, Record<string, SevenTV.EmoteSet>>,

	// Cosmetics
	twitchBadgeSets: {} as Twitch.BadgeSets | null,

	// User State Data
	isModerator: false,
	isVIP: false,
	isDarkTheme: 1,
	primaryColorHex: "#000000",
	useHighContrastColors: true,
	showTimestamps: false,
	currentChannel: {} as CurrentChannel,
	imageFormat: "AVIF" as SevenTV.ImageFormat,

	// Scroll Data
	userInput: 0,
	lineLimit: lineLimit,
	init: false,
	sys: true,
	visible: true,
	paused: false, // whether or not scrolling is paused
	duration: scrollduration,

	messageHandlers: new Set<(v: Twitch.AnyMessage) => void>(),

	scrollBuffer: [] as Twitch.DisplayableMessage[], // twitch chat message buffe when scrolling is paused
	scrollClear: () => {
		return;
	},

	// Functions
	sendMessage: (() => {
		return;
	}) as (msg: string) => void,
});

let flushTimeout: number | undefined;

export function useChatAPI(scroller?: Ref<InstanceType<typeof UiScrollableVue> | undefined>, bounds?: Ref<DOMRect>) {
	const container = ref<HTMLElement | null>(null);

	watchEffect(() => {
		if (scroller?.value?.container) {
			container.value = scroller.value.container;
		}

		if (scroller?.value?.isActive) {
			data.userInput++;
		}
	});

	function addMessage(message: Twitch.DisplayableMessage): void {
		if (data.paused) {
			// if scrolling is paused, buffer the message
			data.scrollBuffer.push(message as Twitch.DisplayableMessage);
			if (data.scrollBuffer.length > data.lineLimit) data.scrollBuffer.shift();

			return;
		}

		if (message.user && !data.chatters[message.user.userID]) {
			data.chatters[message.user.userID] = {};
		}

		data.messageBuffer.push(message);

		flush();
	}

	function clear() {
		data.messages = [];
		data.messageBuffer = [];
		data.emoteProviders = {} as typeof data.emoteProviders;
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

				nextTick(() => scrollToLive(data.duration));

				flushTimeout = undefined;
			}, 25);
		}, 25);
	}

	/**
	 * Scrolls the chat to the bottom
	 */
	function scrollToLive(duration = 0): void {
		if (!container.value || !bounds?.value || data.paused) return;

		data.scrollClear();

		data.sys = true;
		if (duration === 0) {
			container.value.scrollTo({ top: container.value.scrollHeight });

			bounds.value = container.value.getBoundingClientRect();
			return;
		}

		const from = container.value.scrollTop;
		const start = Date.now();

		let shouldClear = false;

		function scroll() {
			if (!container.value || !bounds?.value || data.paused || shouldClear) return;

			const currentTime = Date.now();
			const time = Math.min(1, (currentTime - start) / duration);
			container.value.scrollTop = time * (container.value.scrollHeight - from) + from;

			if (time < 1) requestAnimationFrame(scroll);
			else bounds.value = container.value.getBoundingClientRect();
		}

		data.scrollClear = () => (shouldClear = true);

		if (duration < 1) {
			container.value.scrollTo({ top: container.value.scrollHeight });
			bounds.value = container.value.getBoundingClientRect();
		} else requestAnimationFrame(scroll);
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

	function onScroll() {
		if (!container.value || !bounds?.value) return;

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
	}

	function onWheel(e: WheelEvent) {
		if (e.deltaY < 0) data.userInput++;
	}

	const {
		messages,
		lineLimit,
		emoteMap,
		emoteProviders,
		chatters,
		twitchBadgeSets,
		sys,
		init,
		scrollBuffer,
		paused,
		duration,
		isModerator,
		isVIP,
		isDarkTheme,
		sendMessage,
		currentChannel,
		primaryColorHex,
		useHighContrastColors,
		showTimestamps,
		imageFormat,
		messageHandlers,
	} = toRefs(data);

	return {
		messages: messages,
		lineLimit: lineLimit,
		emoteMap: emoteMap,
		emoteProviders: emoteProviders,
		chatters: chatters,
		twitchBadgeSets: twitchBadgeSets,

		isModerator: isModerator,
		isVIP: isVIP,
		isDarkTheme: isDarkTheme,
		primaryColorHex: primaryColorHex,
		useHighContrastColors: useHighContrastColors,
		showTimestamps: showTimestamps,
		currentChannel: currentChannel,

		messageHandlers: messageHandlers,

		scrollSys: sys,
		scrollInit: init,
		scrollBuffer: scrollBuffer,
		scrollPaused: paused,
		scrollDuration: duration,

		sendMessage,
		clear,
		scrollToLive,
		onScroll,
		onWheel,
		addMessage,
		pauseScrolling,
		unpauseScrolling,

		imageFormat,
	};
}
