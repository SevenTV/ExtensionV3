import { Regex, messagePartType } from "@/site/twitch.tv";
import { convertTwitchEmote } from "@/common/Transform";

export class Tokenizer {
	private newParts = new Array<Twitch.ChatMessage.Part>();
	private emoteMap;

	constructor(parts: Twitch.ChatMessage.Part[], emoteMap: Record<string, SevenTV.ActiveEmote>) {
		this.emoteMap = emoteMap;
		for (const part of parts) {
			switch (part.type) {
				case messagePartType.Text:
				case messagePartType.ModeratedText:
					this.tokenizeText(part.content as string);

					break;
				case messagePartType.Emote:
					this.newParts.push(twitchEmoteToPart(part.content as Twitch.ChatMessage.Part.EmoteContent));
					break;
				case messagePartType.Link:
					this.newParts.push(matchLink(part.content as Twitch.ChatMessage.Part.LinkContent));
					break;
				default:
					this.newParts.push(part);
			}
		}
	}

	private tokenizeText(content: string) {
		const remainder = content.split(Regex.MessageDelimiter).reduce((pre, cur) => {
			const emote = this.emoteMap[cur];

			if (!emote) return pre + cur;

			if (pre != "") this.newParts.push(stringToPart(pre));

			this.handleFoundEmote(emote);

			return "";
		}, "");

		if (remainder == "") return;

		this.newParts.push(stringToPart(remainder));
	}

	private handleFoundEmote(emote: SevenTV.ActiveEmote) {
		// Check if emote is zeroWidth and the preceding non space element is an emote
		if ((emote.data?.flags ?? 0) & 256 && this.newParts.at(-2)?.type == messagePartType.SevenTVEmote) {
			// Remove the " " space element
			this.newParts.pop();

			const previousEmote = this.newParts.pop()?.content as SevenTV.ActiveEmote;

			this.newParts.push(sevenTVEmoteToPart(previousEmote, emote));
			return;
		}

		this.newParts.push(sevenTVEmoteToPart(emote));
	}

	public getParts() {
		return this.newParts;
	}
}

function matchLink(content: { displayText: string; url: string }): Twitch.ChatMessage.Part {
	const match = content.url.match(Regex.SevenTVLink);
	if (match) return linkToSevenTVLink(content, match[0]);
	return {
		type: messagePartType.Link,
		content: content,
	};
}

function stringToPart(content: string): Twitch.ChatMessage.Part {
	return {
		type: messagePartType.Text,
		content: content,
	};
}

// Use type instead
function linkToSevenTVLink(content: Twitch.ChatMessage.Part.LinkContent, emoteID: string): Twitch.ChatMessage.Part {
	return {
		type: messagePartType.SevenTVLink,
		content: {
			...content,
			emoteID: emoteID,
		},
	};
}

function twitchEmoteToPart(emote: Twitch.ChatMessage.Part.EmoteContent): Twitch.ChatMessage.Part {
	return {
		type: messagePartType.SevenTVEmote,
		content: {
			id: emote.emoteID,
			name: emote.alt,
			flags: 0,
			data: convertTwitchEmote({ id: emote.emoteID, token: emote.alt }),
			provider: "TWITCH",
		} as SevenTV.ActiveEmote,
	};
}

function sevenTVEmoteToPart(emote: SevenTV.ActiveEmote, zeroWidth?: SevenTV.ActiveEmote): Twitch.ChatMessage.Part {
	if (!zeroWidth)
		return {
			type: messagePartType.SevenTVEmote,
			content: emote,
		};

	const arr = emote.overlaid ?? [];
	arr.push(zeroWidth);
	return {
		type: messagePartType.SevenTVEmote,
		content: {
			...emote,
			overlaid: arr,
		},
	};
}
