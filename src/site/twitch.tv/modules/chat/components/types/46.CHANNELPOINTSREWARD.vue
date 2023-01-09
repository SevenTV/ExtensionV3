<template>
	<span class="seventv-reward-message-container seventv-highlight">
		<div class="reward-part">
			{{ msg.displayName }}
			redeemed
			{{ msg.reward.name }}
			{{ msg.reward.cost }}
		</div>

		<!-- Message part -->
		<div v-if="msg.message" class="message-part">
			<UserMessage :msg="msg.message" />
		</div>
	</span>
</template>

<script setup lang="ts">
import UserMessage from "../message/UserMessage.vue";

defineProps<{
	msg: Twitch.ChannelPointsRewardMessage;
}>();
</script>

<style scoped lang="scss">
.seventv-reward-message-container {
	display: block;
	padding: 0.5rem 2rem;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
	overflow-wrap: anywhere;
	background-color: hsla(0deg, 0%, 50%, 5%);
}

.seventv-highlight {
	border-left: 0.4rem solid grey;
	padding-left: 1.6rem !important;
}

.message-part {
	margin-top: 0.5rem;
}
</style>
