<template>
	<BanSlider :msg="msg">
		<span class="seventv-chat-message-container">
			<span class="seventv-chat-message" :class="props.msg.banned || props.msg.deleted ? 'deleted' : ''">
				<!-- Chat Author -->
				<template v-if="msg.user && msg.user.userDisplayName">
					<ChatUserTag
						v-if="msg.user"
						:user="msg.user"
						:badges="msg.badges"
						@click="emit('open-viewer-card', $event, msg.user)"
					/>
					<span>: </span>
				</template>

				<!-- Message Content -->
				<span class="seventv-chat-message-body">
					<template v-for="(part, index) of tokenizer.getParts()" :key="index">
						<span v-if="part.type === messagePartType.Text" class="text-part">
							{{ part.content }}
						</span>

						<span v-else-if="part.type === messagePartType.ModeratedText" class="moderated-text-part">
							{{ part.content }}
						</span>

						<span v-else-if="part.type === messagePartType.CurrentUserHighlight" class="mention-part">
							{{ part.content }}
						</span>

						<span
							v-else-if="part.type === messagePartType.Mention"
							:class="part.content.currentUserMentionRelation === 1 ? 'mention-part' : 'text-part'"
						>
							{{ part.content }}
						</span>

						<a v-else-if="part.type === messagePartType.Link" :href="part.content.url" class="link-part">
							{{ part.content.displayText }}
						</a>

						<span v-else-if="part.type === messagePartType.Emote"> !This should not appear! </span>

						<a
							v-else-if="part.type === messagePartType.ClipLink"
							:href="part.content.url"
							class="link-part"
						>
							{{ part.content.displayText }}
						</a>

						<a
							v-else-if="part.type === messagePartType.VideoLink"
							:href="part.content.url"
							class="link-part"
						>
							{{ part.content.displayText }}
						</a>

						<span v-else-if="part.type === messagePartType.SevenTVEmote" class="emote-part">
							<ChatEmote :emote="part.content" />
						</span>
						<a
							v-else-if="part.type === messagePartType.SevenTVLink"
							:href="part.content.url"
							class="link-part"
						>
							{{ part.content.displayText }}
						</a>
					</template>
				</span>
			</span>
		</span>
	</BanSlider>
</template>

<script setup lang="ts">
import ChatUserTag from "@/site/twitch.tv/modules/chat/components/ChatUserTag.vue";
import ChatEmote from "@/site/twitch.tv/modules/chat/components/ChatEmote.vue";
import BanSlider from "@/site/twitch.tv/modules/chat/components/BanSlider.vue";
import { Tokenizer } from "./Tokienizer";
import { useTwitchStore } from "@/site/twitch.tv/TwitchStore";
import { messagePartType } from "@/site/twitch.tv";

const emit = defineEmits<{
	(e: "open-viewer-card", ev: MouseEvent, viewer: Twitch.ChatUser): void;
}>();

const props = defineProps<{
	msg: Twitch.ChatMessage;
	controller?: Twitch.ChatControllerComponent;
}>();

// Tokenize the message

const tokenizer = new Tokenizer(props.msg.messageParts, useTwitchStore().emoteMap);
</script>

<style scoped lang="scss">
.seventv-chat-message-container {
	display: block;
	padding: 0.5rem 2rem;
	overflow-wrap: anywhere;

	&:has(.mention-part) {
		background-color: red;
	}
}

.emote-part {
	display: inline-flex;
	vertical-align: middle;
}

.seventv-chat-message {
	vertical-align: baseline;
}

.mentio-part {
	font-weight: bold;
}

.deleted:not(:hover) {
	opacity: 0.5;
	text-decoration: line-through;
}
</style>
