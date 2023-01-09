<template>
	<span class="seventv-sub-message-container seventv-highlight">
		<div class="sub-part">
			<div class="sub-message-icon">
				<TwPrime v-if="msg.methods?.plan == 'Prime'" />
				<TwStar v-else />
			</div>
			<div class="sub-message-text">
				<span class="sub-name bold">
					{{ msg.user.displayName }}
				</span>
				<span class="bold">Subscribed</span>
				with
				{{ plan }}. They've subscribed for
				<span class="bold"> {{ msg.cumulativeMonths }} months! </span>
				<template v-if="msg.shouldShareStreakTenure">
					{{ msg.streakMonths }} month{{ (msg.streakMonths ?? 0) > 1 ? "s" : "" }} in a row.
				</template>
			</div>
		</div>

		<!-- Message part -->
		<div v-if="msg.message" class="message-part">
			<UserMessage :msg="msg.message" />
		</div>
	</span>
</template>

<script setup lang="ts">
import TwPrime from "@/assets/svg/twitch/TwPrime.vue";
import TwStar from "@/assets/svg/twitch/TwStar.vue";
import UserMessage from "../message/UserMessage.vue";

const props = defineProps<{
	msg: Twitch.SubMessage;
}>();

const plan = props.msg.methods?.plan == "Prime" ? "Prime" : "Tier " + props.msg.methods?.plan.charAt(0);
</script>

<style scoped lang="scss">
@import "@/assets/style/submessage.scss";
</style>
