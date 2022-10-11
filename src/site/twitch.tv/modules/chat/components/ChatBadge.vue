<template>
	<div class="seventv-chat-badge">
		<img :src="badge.image1x" :srcset="srcset" :alt="badge.title" />
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	badge: Twitch.ChatBadge;
}>();

const srcset = `${props.badge.image1x} 1x, ${props.badge.image2x} 2x, ${props.badge.image4x} 4x`;
</script>

<style scoped lang="scss">
.seventv-chat-badge {
	display: inline-block;
	vertical-align: middle;
}
</style>
