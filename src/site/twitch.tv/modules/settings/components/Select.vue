<template>
	<div>
		<template v-for="(option, i) of props.node.options" :key="i">
			<input v-model="setting" class="radio-button" type="radio" :value="option" />
			{{ option }}
			<br />
		</template>
	</div>
</template>

<script setup lang="ts">
import { useSettings } from "@/composable/useSettings";
import { Ref } from "vue";
const props = defineProps<{
	node: SevenTV.SettingNode<string>;
}>();

const setting = useSettings().get(props.node.key) as Ref<string>;
</script>
<style scoped lang="scss">
.radio-button {
	margin-right: 1rem;
}
</style>
