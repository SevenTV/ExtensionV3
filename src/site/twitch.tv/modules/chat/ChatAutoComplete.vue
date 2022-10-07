<script setup lang="ts">
import { log } from "@/common/Logger";
import { getAutocompleteHandler, Selectors } from "@/site/twitch.tv";
import { watch } from "vue";
import { useTwitchStore } from "../../TwitchStore";
import { storeToRefs } from "pinia";
import { definePropertyProxy, defineFunctionHook, defineNamedEventHandler } from "@/common/Reflection";

const TOKENS_SET_ID = "7TV-AutoCompleteTokens";

const chatStore = useTwitchStore();
const { chatController, emoteMap } = storeToRefs(chatStore);

function findMatchingTokens(str: string, twitchSets?: Twitch.TwitchEmoteSet[]): string[] {
	const matches = new Set<string>();

	const prefix = str.toLowerCase();

	for (const [token, emote] of Object.entries(emoteMap.value)) {
		if (token.toLowerCase().startsWith(prefix)) matches.add(token);
	}

	if (twitchSets) {
		for (const set of twitchSets) {
			if (set.id == TOKENS_SET_ID) continue;
			for (const emote of set.emotes) {
				if (emote.token.toLowerCase().startsWith(prefix)) matches.add(emote.token);
			}
		}
	}

	return Array.from(matches).sort();
}

function handleTabPress(this: Twitch.ChatInputComponent, ev: KeyboardEvent): void {
	if (ev.key != "Tab") return;

	const slate = this?.state?.slateEditor;
	if (!slate) return;

	const cursorLocation = slate.selection?.anchor;
	if (!cursorLocation) return;

	let currentNode: any = slate;
	for (const i of cursorLocation.path) {
		if (!currentNode) break;
		currentNode = currentNode.children[i];
	}

	let currentWord: string | null = null;
	let wordStart = 0;
	let wordEnd = 0;
	if (currentNode.type == "text" && typeof currentNode.text == "string") {
		const searchText = currentNode.text;

		for (let i = cursorLocation.offset; ; i--) {
			const currentChar = searchText.charAt(i - 1);
			if (i < 1 || currentChar === " ") {
				wordStart = i;
				break;
			}
		}

		for (let i = cursorLocation.offset + 1; ; i++) {
			const currentChar = searchText.charAt(i - 1);
			if (i > searchText.length || currentChar === " ") {
				wordEnd = i - 1;
				break;
			}
		}

		if (cursorLocation.offset != wordStart) {
			currentWord = searchText.substring(wordStart, wordEnd);
		}
	}

	if (currentWord && currentWord != " ") {
		let state = this._SEVENTV_state;
		if (!state) state = {}; this._SEVENTV_state = state;

		let replacement: string | null = null;

		let matchIndex = 0;
		let matches: string[];
		if (!state.tabState
			|| state.tabState.expectedPath != cursorLocation.path
			|| state.tabState.expectedOffset != cursorLocation.offset
			|| state.tabState.expectedWord != currentWord
		) {
			matches = findMatchingTokens(currentWord, this.props.emotes);
			replacement = matches[matchIndex];
		}
		else {
			matches = state.tabState.matches;
			matchIndex = state.tabState.index + 1;
			matchIndex %= matches.length;
			replacement = matches[matchIndex];
		}

		if (replacement) {
			slate.apply({type: "remove_text", path: cursorLocation.path, offset: wordStart, text: currentWord});
			slate.apply({type: "insert_text", path: cursorLocation.path, offset: wordStart, text: replacement});

			const newOffset = wordStart + replacement.length;

			const newCursor = {path: cursorLocation.path, offset: newOffset};
			slate.apply({type: "set_selection", newProperties: {anchor: newCursor, focus: newCursor}});

			state.tabState = {
				index: matchIndex,
				matches: matches,
				expectedOffset: newOffset,
				expectedPath: cursorLocation.path,
				expectedWord: replacement
			};

			ev.preventDefault();
			ev.stopImmediatePropagation();
		}
		else {
			state.tabState = undefined;
		}
	}
}

const autoCompleteEmotes: Twitch.TwitchEmoteSet = {
	id: TOKENS_SET_ID,
	emotes: []
};

//Fill in our set with tokens for Twitch's slate editor.
watch(emoteMap, (map) => {
	autoCompleteEmotes.emotes.length = 0;

	for (const [token, emote] of Object.entries(map)) {
		autoCompleteEmotes.emotes.push({
			setID: TOKENS_SET_ID,
			// id: `7TV-${emote.id}`,
			id: "115234",
			token: token,
			type: "7TV"
		});
	}
}, {immediate: true, deep: true});

watch(chatController, (controller) => {
	if (!controller) return;

	const inputEl = document.querySelector(Selectors.ChatInput) as HTMLInputElement;
	if (!inputEl) return;

	const acHandler = getAutocompleteHandler(inputEl);
	if (!acHandler) return;

	const input = acHandler.componentRef;
	if (input) {
		definePropertyProxy(input, "props", {
			get: (obj, prop) => {
				switch (prop) {
					case "emotes": return Reflect.has(obj, prop) ? [autoCompleteEmotes, ...obj[prop]] : [autoCompleteEmotes];
					default: return obj[prop];
				}
			}
		});

		defineNamedEventHandler(inputEl, "AutoComplete", "keydown", handleTabPress.bind(input));
	}

	const mentionProvider = acHandler.providers.find(provider => provider.autocompleteType == "mention");
	if (mentionProvider) {
		mentionProvider.canBeTriggeredByTab = false;
	}

	const emoteProvider = acHandler.providers.find(provider => provider.autocompleteType == "emote");
	if (emoteProvider) {
		defineFunctionHook(emoteProvider, "getMatches", function(old, str: string, ...args: any[]) {
			if (!str.startsWith(":") || str.length < 3) return;

			const results = old.call(this, str, ...args) ?? [];

			const emotes = emoteMap.value;
			const tokens = findMatchingTokens(str.substring(1));
			for (let i = tokens.length - 1; i > -1; i--) {
				const token = tokens[i];
				const emote = emotes[token];

				const host = emote?.data?.host ?? { url: "", files: [] };
				const srcset = host.files
					.filter(f => f.format === host.files[0].format)
					.map((f, i) => `${host.url}/${f.name} ${i + 1}x`)
					.join(", ");

				results.unshift({
					type: "emote",
					current: str,
					element: [
						{
							$$typeof: Symbol.for("react.element"),
							ref: null,
							key: `emote-img-${emote.id}`,
							type: 'img',
							props: {
								style: {
									padding: '0.5rem'
								},
								srcset: srcset
							}
						},
						{
							$$typeof: Symbol.for("react.element"),
							ref: null,
							key: `emote-text-${emote.id}`,
							type: 'span',
							props: {
								children: `${emote.name}`
							}
						}
					],
					replacement: token
				});
			}

			return results.length > 0 ? results : undefined;
		});
	}
}, {immediate: true});
</script>
