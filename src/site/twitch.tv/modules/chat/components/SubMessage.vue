<template>
	<span class="seventv-sub-message-container">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime />
			</div>
			<div class="sub-message-text">
				<span class="name">
					{{ msg.user.userDisplayName }}
				</span>
				<span> Subscribed with {{ msg.methods?.plan }}. </span>
				<span v-if="msg.type == MessageType.RESUBSCRIPTION">
					They've subscribed for {{ msg.cumulativeMonths }} months!
				</span>
			</div>
		</div>

		<!-- Message part -->
		<Message v-if="msg.message" :msg="msg.message" />
	</span>
</template>

<script setup lang="ts">
import { MessageType } from "@/site/twitch.tv";
import TwPrime from "@/assets/svg/TwPrime.vue";
import Message from "./message/Message.vue";

defineProps<{
	msg: Twitch.SubMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-sub-message-container {
	display: block;
	padding: 0.5rem 2rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 10%);

	&:has(.mention-part) {
		display: block;
		padding: 0.5rem 2rem;
		overflow-wrap: anywhere;
		box-shadow: inset 0 0 0.2rem 0.2rem red;
		background-color: #ff000040;
		border-radius: 0.4rem;
	}
}

.highlight {
	border-left: 0.4rem blue;
	padding-left: 1.6rem;

	&:has(.seventv-ban-slider) {
		border-left: none !important;
		padding-left: 2rem;

		--ban-slider-color: blue;
	}
}
.sub-part {
	display: flex;
	margin-bottom: 0.5rem;
}
</style>
