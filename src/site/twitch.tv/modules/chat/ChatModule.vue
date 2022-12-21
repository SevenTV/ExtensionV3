<template>
	<template v-if="chatController.instances.length">
		<ChatController v-if="dependenciesMet" :controller="chatController.instances[0]" @hooked="onHooked" />
	</template>
</template>

<script setup lang="ts">
import { useComponentHook } from "@/common/ReactHooks";
import { useModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = useModule("chat", {
	name: "Chat",
	depends_on: [],
});

const chatController = useComponentHook<Twitch.ChatControllerComponent>(
	{
		parentSelector: ".chat-shell",
		predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,
	},
	{
		trackRoot: true,
	},
);

function onHooked() {
	markAsReady();
}
</script>
