<template>
	<span v-if="msg" class="seventv-chat-message">
		<!-- Chat Author -->
		<template v-if="msg.user && msg.user.userDisplayName">
			<ChatUserTag v-if="msg.user" :user="msg.user" @click="emit('open-viewer-card', $event, msg.user)" />
			<span>: </span>
		</template>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			{{ msg.messageBody }}
		</span>
	</span>
</template>

<script setup lang="ts">
import { Twitch } from "@/site/twitch.tv";
import ChatUserTag from "@/site/twitch.tv/modules/chat/ChatUserTag.vue";

const emit = defineEmits<{
	(e: "open-viewer-card", ev: MouseEvent, viewer: Twitch.ChatUser): void;
}>();

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();
</script>

<style scoped lang="scss"></style>
