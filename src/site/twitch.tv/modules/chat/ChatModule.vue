<template>
	<template v-for="inst of chatList.instances" :key="inst.identifier">
		<ChatController v-if="dependenciesMet" :list="inst" />
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

const chatList = useComponentHook<Twitch.ChatListComponent>(
	{
		parentSelector: ".chat-list--default",
		predicate: (n) => n.scrollRef,
	},
	{
		trackRoot: true,
		replaceContents: true,
	},
);

markAsReady();
</script>
