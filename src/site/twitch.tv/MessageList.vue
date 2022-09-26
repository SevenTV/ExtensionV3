<template>lawl</template>

<script setup lang="ts">
import { getChatController } from "@/common/hook/TwitchHook";

const controller = getChatController();

controller.props.messageHandlerAPI.addMessageHandler(msg => {});
</script>

<style scoped lang="scss"></style>
