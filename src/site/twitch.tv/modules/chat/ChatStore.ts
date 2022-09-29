import { Twitch } from "@/site/twitch.tv";
import { defineStore } from "pinia";

export interface State {
	channel: CurrentChannel | null;
	messages: Twitch.ChatMessage[];
	lineLimit: number;
}

export const useChatStore = defineStore("chat", {
	state: () =>
		({
			channel: null,
			messages: [],
			lineLimit: 200,
		} as State),

	getters: {
		currentMessage: (state) => state.messages[state.messages.length - 1],
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

interface CurrentChannel {
	id: string;
	login: string;
	displayName: string;
}
