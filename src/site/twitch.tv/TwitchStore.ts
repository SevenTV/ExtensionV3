import { defineStore } from "pinia";
import { ref, Ref } from "vue";

export interface State {
	channel: CurrentChannel | null;
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

		setChannel(channel: CurrentChannel) {
			if (this.channel && this.channel.id === channel.id) {
				return; // no change.
			}

			this.channel = channel;
			this.messages = [];
		},
	},
});

interface CurrentChannel {
	id: string;
	login: string;
	displayName: string;
}
