<template>
	<template v-for="(inst, i) of chatList.instances" :key="inst.identifier">
		<ChatController v-if="dependenciesMet && isHookable" :list="inst" :controller="chatController.instances[i]" />
	</template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getTrackedNode, useComponentHook } from "@/common/ReactHooks";
import { useModule } from "@/composable/useModule";
import ChatController from "./ChatController.vue";

const { dependenciesMet, markAsReady } = useModule("chat", {
	name: "Chat",
	depends_on: [],
	config: [
		{
			key: "general.blur_unlisted_emotes",
			label: "Unlisted Emotes",
			hint: "If checked, emotes which have not yet been approved for listing on 7tv.app will be blurred",
			type: "TOGGLE",
			options: ["Show", "Blur"],
			defaultValue: false,
		},
		{
			key: "chat.emote_margin",
			label: "Emote Margin",
			hint: "Choose the margin around emotes in chat. Negative values lets them overlap and keep the chatlines inline",
			type: "INPUT",
			options: ["-1rem"],
			predicate: (p) => CSS.supports("margin", p as string),
			defaultValue: "-1rem",
		},
		{
			key: "chat.mod_slider",
			label: "Mod Slider",
			hint: "Enable the mod slider in channels where you are moderator",
			type: "TOGGLE",
			defaultValue: true,
		},
		{
			key: "chat.show_timestamps",
			label: "Show Timestamps",
			hint: "Show timestamps on messages sendt in the chat",
			type: "TOGGLE",
			defaultValue: false,
		},
		{
			key: "chat.slash_me_style",
			label: "/me Style",
			hint: "How the /me type messages should be displayed",
			type: "DROPDOWN",
			options: [
				["Nothing", 0],
				["Italic", 1],
				["Colored", 2],
				["Italic + Colored", 3],
			],
			defaultValue: 1,
		},
	],
});

const chatList = useComponentHook<Twitch.ChatListComponent>(
	{
		parentSelector: ".chat-list--default",
		predicate: (n) => n.scrollRef,
	},
	{
		trackRoot: true,
		hooks: {
			render: function (inst) {
				const nodes = inst.component.props.children.map((vnode) =>
					vnode.key ? getTrackedNode(inst, vnode.key as string, vnode) : null,
				);

				return nodes;
			},
		},
	},
);

const chatController = useComponentHook<Twitch.ChatControllerComponent>({
	parentSelector: ".chat-shell, .stream-chat",
	predicate: (n) => n.pushMessage && n.props?.messageHandlerAPI,
});

const isHookable = computed(() => chatController.instances.length === chatList.instances.length);

markAsReady();
</script>
