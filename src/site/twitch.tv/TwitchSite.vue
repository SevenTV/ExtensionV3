<template>
	<ChatController :key="seq" />
</template>

<script setup lang="ts">
import { getRouter, getUser } from "@/site/twitch.tv";
import { useStore } from "@/store/main";
import { ref } from "vue";
import ChatController from "./modules/chat/ChatController.vue";

const store = useStore();

// Retrieve the current user from twitch internals
const user = getUser()?.props.user ?? null;

// Retrieve twitch's internal router
const router = getRouter();

// Define the current platform identtiy
store.setIdentity(
	"TWITCH",
	user
		? {
				id: user.id,
				login: user.login,
				displayName: user.displayName
		  }
		: null
);

const seq = ref(0);

//
if (router) {
	// router may be undefined in certain places, such as popout chat
	const route = router.props.location;

	router.props.history.listen((loc, act) => {
		seq.value++;
	});
}
</script>
