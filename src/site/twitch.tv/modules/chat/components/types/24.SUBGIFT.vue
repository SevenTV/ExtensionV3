<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="gift-icon">
				<TwGift />
			</div>
			<div class="sub-message-text">
				<span class="sub-name bold">
					{{ msg.user.displayName }}
				</span>
				Gifted a
				<span class="bold"> Tier {{ msg.methods?.plan.charAt(0) }} </span>
				sub to
				<span class="bold"> {{ msg.recipientDisplayName }} </span>
			</div>
		</div>
	</span>
</template>

<script setup lang="ts">
import TwGift from "@/assets/svg/twitch/TwGift.vue";

defineProps<{
	msg: Twitch.SubMessage;
}>();
</script>

<style scoped lang="scss">
@import "@/assets/style/submessage.scss";
</style>
