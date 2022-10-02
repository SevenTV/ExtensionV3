<template>
	<img class="chat-emote" :srcset="srcset" />
</template>

<script setup lang="ts">
const props = defineProps<{
	emote: SevenTV.ActiveEmote;
	format: SevenTV.ImageFormat;
}>();

const host = props.emote.data?.host ?? { url: "", files: [] };
const srcset = host.files
	.filter(f => f.format === props.format)
	.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
	.join(", ");
</script>

<style scoped lang="scss">
img.chat-emote {
	vertical-align: middle;
	color: red;
	font-weight: 900;
}
</style>
