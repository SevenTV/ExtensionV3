<template>
	<span v-if="msg" class="seventv-chat-message">
		<!-- Chat Author -->
		<span
			v-if="msg.user && msg.user.userDisplayName"
			class="seventv-chat-message-author"
			:style="{ color: msg.user.color }"
			@click="emit('open-viewer-card', $event, msg.user)"
		>
			<span class="seventv-chat-message-author-username">
				{{ msg.user.userDisplayName }}
			</span>
			<span class="seventv-chat-message-author-separator">: </span>
		</span>

		<!-- Message Content -->
		<span class="seventv-chat-message-body">
			{{ msg.messageBody }}
		</span>
	</span>
</template>

<script setup lang="ts">
import { Twitch } from "@/site/twitch.tv";
import { onBeforeUnmount } from "vue";
import { destroyObject } from "@/common/mem";

const emit = defineEmits<{
	(e: "open-viewer-card", ev: MouseEvent, viewer: Twitch.ChatUser): void;
}>();

const props = defineProps<{
	msg: Twitch.ChatMessage;
}>();

onBeforeUnmount(() => {
	destroyObject(props.msg);
});
</script>

<style scoped lang="scss">
.seventv-chat-message-author {
	cursor: pointer;
	word-break: break-all;
}

.seventv-chat-message-author-username {
	font-weight: 700;

	&:hover {
		text-decoration: underline;
	}
}
</style>
