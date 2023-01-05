<template>
	<span class="seventv-sub-message-container">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime />
			</div>
			<div class="sub-message-text">
				<span class="sub-name">
					{{ msg.user.displayName }}
				</span>
				<span> Subscribed with {{ msg.methods?.plan }}. </span>
				<span v-if="msg.type == MessageType.RESUBSCRIPTION">
					They've subscribed for {{ msg.cumulativeMonths }} months!
				</span>
			</div>
		</div>

		<!-- Message part -->
		<div class="message-part">
			<UserMessage v-if="msg.message" :msg="msg.message" />
		</div>
	</span>
</template>

<script setup lang="ts">
import { MessageType } from "@/site/twitch.tv";
import TwPrime from "@/assets/svg/TwPrime.vue";
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	msg: Twitch.SubMessage;
}>();
</script>

<style scoped lang="scss">
@import "@/assets/style/submessage.scss";
</style>
