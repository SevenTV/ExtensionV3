<template>
	<span v-if="msg" class="seventv-chat-message">
		<!-- Chat Author -->
		<template v-if="msg.user && msg.user.userDisplayName">
			<ChatUserTag v-if="msg.user" :user="msg.user" @click="emit('open-viewer-card', $event, msg.user)" />
			<span>: </span>
		</template>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<span class="message-token" :token-type="t.type" v-for="t of tokens">
				<template v-if="t.type === 'text'">
					{{ t.value }}
				</template>
				<template v-else-if="t.type === 'emote'">
					<ChatEmote :emote="t.value" format="PNG" />
				</template>
			</span>
		</span>
	</span>
</template>

<script setup lang="ts">
import ChatUserTag from "@/site/twitch.tv/modules/chat/ChatUserTag.vue";
import { storeToRefs } from "pinia";
import { useTwitchStore } from "../../TwitchStore";
import ChatEmote from "@/components/ChatEmote.vue";

const emit = defineEmits<{
	(e: "open-viewer-card", ev: MouseEvent, viewer: Twitch.ChatUser): void;
}>();

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

const { emoteMap } = storeToRefs(useTwitchStore());

// Tokenize the message
const tokens = [] as MessageToken[];

if (props.msg && typeof props.msg.messageBody === "string") {
	const split = (props.msg.messageBody ?? "").split(" ");
	const currentText = [] as string[];

	const tokenOfCurrentText = () => {
		tokens.push({
			type: "text",
			value: currentText.join(" "),
		} as MessageToken<"text">);

		currentText.length = 0;
	};

	let i = 0;
	while (split.length) {
		const s = split.shift()!;

		const emote = emoteMap.value[s];
		const start = !split[i - 1];
		const end = !split[i + 1];

		if (emote) {
			tokenOfCurrentText();

			tokens.push({
				type: "emote",
				value: emote,
			} as MessageToken<"emote">);
		} else {
			currentText.push(start ? "" : " ", s, end ? "" : " ");
		}

		i++;
	}
	tokenOfCurrentText();
}

interface MessageToken<T extends MessageTokenType = any> {
	type: T;
	value: MessageTokenValue<T>;
}

type MessageTokenValue<T extends MessageTokenType> = {
	text: string;
	emote: SevenTV.ActiveEmote;
	[key: string]: any;
}[T];

type MessageTokenType = "text" | "emote";
</script>

<style scoped lang="scss">
.seventv-chat-message {
	display: inline-block !important;
	vertical-align: middle;
}
</style>
