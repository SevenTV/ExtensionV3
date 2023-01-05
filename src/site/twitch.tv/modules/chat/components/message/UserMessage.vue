<template>
	<span
		class="seventv-chat-message"
		:class="{
			deleted: msg.banned || msg.deleted,
			'slash-me-italic': msg.messageType === 1,
		}"
		:style="{ color: msg.messageType === 1 ? adjustedColor : '' }"
	>
		<!-- Chat Author -->
		<UserTag v-if="msg.user" :user="msg.user" :badges="msg.badges" :color="adjustedColor" />

		<span>
			{{ msg.messageType === 0 ? ": " : " " }}
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			<template v-for="(part, index) of tokens" :key="index">
				<span v-if="part.type === MessagePartType.TEXT" class="text-part">
					{{ part.content }}
				</span>

				<span v-else-if="part.type === MessagePartType.MODERATEDTEXT" class="moderated-text-part">
					{{ part.content }}
				</span>

				<span v-else-if="part.type === MessagePartType.CURRENTUSERHIGHLIGHT" class="mention-part">
					{{ part.content }}
				</span>

				<span
					v-else-if="part.type === MessagePartType.MENTION"
					:class="part.content.currentUserMentionRelation === 1 ? 'mention-part' : 'text-part'"
				>
					{{ "@" + part.content.recipient }}
				</span>

				<a v-else-if="part.type === MessagePartType.LINK" :href="part.content.url" class="link-part">
					{{ part.content.displayText }}
				</a>

				<span v-else-if="part.type === MessagePartType.EMOTE"> !This should not appear! </span>

				<a v-else-if="part.type === MessagePartType.CLIPLINK" :href="part.content.url" class="link-part">
					{{ part.content.displayText }}
				</a>

				<a v-else-if="part.type === MessagePartType.VIDEOLINK" :href="part.content.url" class="link-part">
					{{ part.content.displayText }}
				</a>

				<span v-else-if="part.type === MessagePartType.SEVENTVEMOTE" class="emote-part">
					<Emote :emote="part.content" :image-format="imageFormat" />
				</span>
				<a v-else-if="part.type === MessagePartType.SEVENTVLINK" :href="part.content.url" class="link-part">
					{{ part.content.displayText }}
				</a>
			</template>
		</span>
	</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { MessagePartType } from "@/site/twitch.tv";
import { useChatAPI } from "@/site/twitch.tv/ChatAPI";
import Emote from "@/site/twitch.tv/modules/chat/components/message/Emote.vue";
import UserTag from "@/site/twitch.tv/modules/chat/components/message/UserTag.vue";
import { Tokenizer } from "./Tokenizer";
import { normalizeUsername } from "../../ChatBackend";

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

// Tokenize the message
const { emoteMap, imageFormat } = useChatAPI();

const tokenizer = new Tokenizer(props.msg.messageParts);
const tokens = computed(() => {
	return tokenizer.getParts(emoteMap.value);
});

// TODO: Get the get the readableChatColors from somewhere and return uncomputed name
const { isDarkTheme } = useChatAPI();
const adjustedColor = computed(() => {
	return normalizeUsername(props.msg.user.color, isDarkTheme.value as 0 | 1);
});
</script>

<style scoped lang="scss">
.seventv-chat-message {
	vertical-align: baseline;
	.emote-part {
		display: inline-grid;
		vertical-align: middle;
		margin: -1rem 0;
	}

	.mention-part {
		padding: 0.2rem;
		font-weight: bold;
	}
}

.slash-me-italic {
	font-style: italic;
}
.deleted:not(:hover) {
	opacity: 0.5;
	text-decoration: line-through;
}
</style>
