<template>
	<UiScrollable class="scroll-area">
		<div class="emote-area">
			<template v-for="(emoteSet, i) of emoteSets" :key="i">
				<div :ref="'set-' + i.toString()" class="emote-set-container">
					<div class="set-header">
						<div class="set-icon-header"></div>
						{{ emoteSet.name }}
					</div>
					<div class="emote-set">
						<template v-for="emote of emoteSet.emotes" :key="emote.name">
							<div
								class="emote-container"
								:class="`ratio-${determineRatio(emote)}`"
								@click="insertText(emote.name)"
							>
								<ChatEmote :emote="emote" />
							</div>
						</template>
					</div>
				</div>
			</template>
		</div>
	</UiScrollable>
	<div class="sidebar">
		<template v-for="(emoteSet, i) of emoteSets" :key="i">
			<div
				v-if="emoteSet.emotes.length"
				class="set-icon"
				@click="
					{
						selectedSet = i;
						($refs['set-' + i.toString()] as HTMLDivElement[])[0].scrollIntoView({ behavior: 'smooth' });
					}
				"
			>
				{{ emoteSet.id.slice(0, 4) }}
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { determineRatio } from "./EmoteMenuBackend";
import ChatEmote from "../chat/components/ChatEmote.vue";
import UiScrollable from "@/ui/UiScrollable.vue";

const props = defineProps<{
	emoteSets: SevenTV.EmoteSet[];
	inputController: Twitch.ChatInputController;
}>();

function insertText(text: string) {
	const inputRef = props.inputController.autocompleteInputRef;
	const current = inputRef.getValue();

	inputRef.setValue(current + (current.endsWith(" ") ? "" : " ") + text + " ");
}

const selectedSet = ref(0);
</script>
<style scoped lang="scss">
.scroll-area {
	width: 28rem;
}

.emote-set-container {
	position: relative;
}

.emote-set {
	display: inline-flex;
	flex-wrap: wrap;
	margin: 0.5rem;
}

.set-header {
	height: 3rem;
	padding: 0.5rem;
	position: sticky;
	top: 0;
	display: flex;
	background: #252528;
	box-shadow: 0 1px 2px black;
}

.set-icon-header {
	height: 2rem;
	width: 2rem;
	background-color: green;
	border-radius: 0.5rem;
	margin-right: 1rem;
}

.emote-container {
	display: grid;
	background: rgba(217, 217, 217, 3%);
	border-radius: 0.5rem;
	height: 4rem;
	margin: 0.25rem;
	cursor: pointer;

	&:hover {
		background: hsla(0deg, 0%, 100%, 16%);
	}
}

.ratio-1 {
	width: 4rem;
}

.ratio-2 {
	width: 6.25rem;
}

.ratio-3 {
	width: 8.5rem;
}

.ratio-4 {
	width: 13rem;
}

.sidebar {
	width: 4rem;
	height: 100%;
	background: rgba(217, 217, 217, 3%);
	border-left: 1px solid black;
}
</style>
