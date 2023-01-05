<template>
	<span class="seventv-chat-message-container">
		<Message :msg="msg" />
	</span>
</template>

<script setup lang="ts">
import Message from "./message/Message.vue";

defineProps<{
	msg: Twitch.ChatMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-chat-message-container {
	display: block;
	padding: 0.5rem 2rem;
	overflow-wrap: anywhere;

	&:has(.mention-part) {
		display: block;
		padding: 0.5rem 2rem;
		overflow-wrap: anywhere;
		box-shadow: inset 0 0 0.2rem 0.2rem red;
		background-color: #ff000040;
		border-radius: 0.4rem;
	}
}
</style>
