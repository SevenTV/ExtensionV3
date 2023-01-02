<template>
	<div class="inputbox">
		<input
			:id="node.key"
			v-model="setting"
			type="inputbox"
			:placeholder="(node.options?.at(0) as string | undefined)"
		/>
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
