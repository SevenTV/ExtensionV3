<template>
	<select :id="node.key" v-model="setting">
		<option v-for="(option, i) of node.options" :key="i" :value="option">
			{{ option }}
		</option>
	</select>
</template>

<script setup lang="ts">
import { useSettings } from "@/composable/useSettings";
import { Ref } from "vue";
const props = defineProps<{
	node: SevenTV.SettingNode<string>;
}>();

const setting = useSettings().get(props.node.key) as Ref<string>;
</script>
