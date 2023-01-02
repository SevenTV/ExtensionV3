<template>
	<SettingsMenu />
</template>

<script setup lang="ts">
import { useModule } from "@/composable/useModule";
import { useSettings } from "@/composable/useSettings";
import SettingsMenu from "./SettingsMenu.vue";

const { markAsReady } = useModule("settings", {
	name: "Settings",
	depends_on: [],
});

useSettings().register([
	{
		key: "general.hide_unlisted_emotes",
		label: "Hide Unlisted Emotes",
		hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
		type: "CHECKBOX",
		defaultValue: false,
	},
]);

markAsReady();
</script>
