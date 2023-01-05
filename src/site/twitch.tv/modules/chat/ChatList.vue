<template>
	<div v-for="msg of messages" :key="msg.id" :msg-id="msg.id">
		<BanSlider v-if="canModerateType.includes(msg.type)" :msg="msg">
			<component :is="getMessageComponent(msg.type)" :msg="msg" />
		</BanSlider>
		<component :is="getMessageComponent(msg.type)" v-else :msg="msg" />
	</div>
</template>

<script setup lang="ts">
import ChatMessage from "@/site/twitch.tv/modules/chat/components/ChatMessage.vue";
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import SubMessage from "./components/SubMessage.vue";
import BanSlider from "./components/modslider/BanSlider.vue";
import { MessageType } from "../..";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.ChatMessage[];
}>();

function getMessageComponent(type: MessageType) {
	switch (type) {
		case MessageType.MESSAGE:
			return ChatMessage;
		case MessageType.SUBSCRIPTION:
		case MessageType.RESUBSCRIPTION:
			return SubMessage;
		default:
			return ChatMessageUnhandled;
	}
}

const canModerateType = [MessageType.MESSAGE, MessageType.SUBSCRIPTION, MessageType.RESUBSCRIPTION];
</script>
