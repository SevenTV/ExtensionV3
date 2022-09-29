<template>
	<template v-if="el">
		<Teleport :to="to">
			<slot />
		</Teleport>
	</template>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	to: string;
	parent: HTMLElement | string;
}>();

const parent = ref(typeof props.parent === "string" ? document.querySelector(props.parent) : props.parent);

if (!parent.value) {
	parent.value = document.body as Element;
}

const el = ref<HTMLElement | null>(parent.value.querySelector(props.to));

const observer = new MutationObserver((x) => {
	const e = (parent.value as HTMLElement).querySelector<HTMLElement>(props.to);
	if (!e) {
		return;
	}

	el.value = e;

	observer.disconnect();
});

observer.observe(parent.value, {
	childList: true,
	subtree: true,
});
</script>
