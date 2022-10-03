import { useStore } from "@/store/main";
import { NetWorkerMessage, NetWorkerMessageType } from "@/worker";
import { defineStore } from "pinia";
import { ref, Ref } from "vue";

export interface State {
	messages: Twitch.ChatMessage[];
	messageMap: Record<string, Twitch.ChatMessage>;
	lineLimit: number;
	emoteMap: Record<string, SevenTV.ActiveEmote>;
}

export const useTwitchStore = defineStore("chat", {
	state: () =>
		({
			channel: null,
			messages: [],
			messageMap: {} as Record<string, Twitch.ChatMessage>,
			lineLimit: 200,
			emoteMap: {},
		} as State),

	getters: {
		currentMessage: state => state.messages[state.messages.length - 1],
	},

	actions: {
		pushMessage(message: Twitch.ChatMessage, maybeDupe?: boolean) {
			if (maybeDupe && this.messageMap[message.id]) return;

			this.messages.push(message);
			this.messageMap[message.id] = message;

			if (this.messages.length > this.lineLimit) {
				delete this.messageMap[this.messages.shift()!.id];
			}
		},
	},
});
