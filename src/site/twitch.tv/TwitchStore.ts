import { useStore } from "@/store/main";
import { NetWorkerMessage, NetWorkerMessageType } from "@/worker";
import { defineStore } from "pinia";
import { ref, Ref } from "vue";

export interface State {
	messages: Twitch.ChatMessage[];
	lineLimit: number;
	emoteMap: Record<string, SevenTV.Emote>;
}

export const useTwitchStore = defineStore("chat", {
	state: () =>
		({
			channel: null,
			messages: [],
			lineLimit: 200,
			emoteMap: {},
		} as State),

	getters: {
		currentMessage: state => state.messages[state.messages.length - 1],
	},

	actions: {
		pushMessage(message: Twitch.ChatMessage) {
			this.messages.push(message);

			if (this.messages.length > this.lineLimit) {
				this.messages.shift();
			}
		},
	},
});
