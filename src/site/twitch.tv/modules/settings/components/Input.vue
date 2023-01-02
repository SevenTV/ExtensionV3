<template>
	<div class="inputbox">
		<input id="inputbox" v-model="setting" type="inputbox" />
	</div>
</template>

<script setup lang="ts">
import { useSettings } from "@/composable/useSettings";
import { Ref } from "vue";
const props = defineProps<{
	node: SevenTV.SettingNode<boolean>;
}>();

const setting = useSettings().get(props.node.key) as Ref<string>;
</script>
