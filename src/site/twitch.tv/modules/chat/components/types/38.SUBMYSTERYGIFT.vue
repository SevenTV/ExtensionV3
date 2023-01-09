<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="gift-icon">
				<TwMassGift />
			</div>
			<div class="sub-message-text">
				<span class="sub-name-big">
					{{ msg.user.displayName }}
				</span>
				is gifting {{ msg.senderCount }} Tier {{ msg.plan.charAt(0) }} Sub
				{{ msg.senderCount > 1 ? "s" : "" }} to {{ msg.channel }}'s community.
				<template v-if="msg.senderCount == msg.massGiftCount">
					It's their first Gift Sub in the channel!
				</template>
				<template v-else> They've gifted a total of {{ msg.massGiftCount }} Subs in the channel! </template>
			</div>
		</div>
	</span>
</template>

<script setup lang="ts">
import TwMassGift from "@/assets/svg/twitch/TwMassGift.vue";

defineProps<{
	msg: Twitch.MassGiftMessage;
}>();
</script>

<style scoped lang="scss">
@import "@/assets/style/submessage.scss";

.sub-name-big {
	display: block;
	font-size: larger;
	font-weight: 700;
}
</style>
