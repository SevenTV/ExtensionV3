<template>
	<div v-for="msg of messages" :key="msg.id" :msg-id="msg.id" class="seventv-message">
		<BanSlider v-if="canModerateType.includes(msg.type)" :msg="msg">
			<component :is="getMessageComponent(msg.type)" :msg="msg" />
		</BanSlider>
		<component :is="getMessageComponent(msg.type)" v-else :msg="msg" />
	</div>
</template>

<script setup lang="ts">
import ChatMessageUnhandled from "./ChatMessageUnhandled.vue";
import BanSlider from "./components/modslider/BanSlider.vue";
import { MessageType } from "../..";

defineProps<{
	controller: Twitch.ChatControllerComponent | undefined;
	messages: Twitch.ChatMessage[];
}>();

const types = import.meta.glob<object>("./components/types/*.vue", { eager: true, import: "default" });

function getMessageComponent(type: MessageType) {
	const e = MessageType[type];
	const test = `./components/types/${e}.vue`;
	return types[test] ?? ChatMessageUnhandled;
}

const canModerateType = [MessageType.MESSAGE, MessageType.SUBSCRIPTION, MessageType.RESUBSCRIPTION];
</script>
<style scoped lang="scss">
.seventv-message {
	&:has(.mention-part) {
		box-shadow: inset 0 0 0.1rem 0.1rem red;
		background-color: #ff000040;
		border-radius: 0.4rem;
	}
}
</style>
