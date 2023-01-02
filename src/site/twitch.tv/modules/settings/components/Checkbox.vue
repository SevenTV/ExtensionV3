<template>
	<div>
		<input id="checkbox" v-model="setting" type="checkbox" />
	</div>
</template>

<script setup lang="ts">
import { useSettings } from "@/composable/useSettings";
import { Ref } from "vue";
const props = defineProps<{
	node: SevenTV.SettingNode<boolean>;
}>();

const setting = useSettings().get(props.node.key) as Ref<boolean>;
</script>
