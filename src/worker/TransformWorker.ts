// TransformWorker provides tools to convert and manipulate data without occupying the main thread.

import { log } from "@/common/Logger";
import { TransformWorkerMessage, TransformWorkerMessageType, TypedTransformWorkerMessage } from ".";
import { db } from "@/db/IndexedDB";

const w = (self as unknown) as DedicatedWorkerGlobalScope;

// Set up logger
log.setContextName("TransformWorker");

w.onmessage = async ev => {
	if (ev.data.source !== "SEVENTV") {
		return; // not a message from us
	}

	switch (ev.data.type as TransformWorkerMessageType) {
		case TransformWorkerMessageType.TWITCH_EMOTES: {
			const msg = ev.data as TransformWorkerMessage<TransformWorkerMessageType.TWITCH_EMOTES>;
			if (!msg.data.input) return;

			const sets = Array(msg.data.input.length);

			for (let i = 0; i < msg.data.input.length; i++) {
				sets[i] = ConvertTwitchEmoteSet(msg.data.input[i]);

				// Update individual sets if they already exist in DB
				db.emoteSets.where({ id: sets[i].id, provider: "TWITCH" }).modify(sets[i]);
			}

			// Store the emote sets in the database
			db.emoteSets.bulkPut(sets);
			break;
		}

		default:
			break;
	}
};

function sendMessage<T extends TransformWorkerMessageType>(
	t: T,
	data: TypedTransformWorkerMessage<T>,
	seq: number,
): void {
	w.postMessage({
		source: "SEVENTV",
		type: t,
		seq,
		data,
	});
}

export function ConvertTwitchEmoteSet(data: Twitch.TwitchEmoteSet): SevenTV.EmoteSet {
	return {
		id: data.id,
		name: "TwitchSet#" + data.id,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "TWITCH",
		emotes: data.emotes.map(e => ({
			id: e.id,
			name: e.token,
			flags: 0,
			provider: "TWITCH",
			data: ConvertTwitchEmote(e),
		})),
	};
}

export function ConvertTwitchEmote(data: Twitch.TwitchEmote): SevenTV.Emote {
	return {
		id: data.id,
		name: data.token,
		flags: 0,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "https://static-cdn.jtvnw.net/emoticons/v1/" + data.id + "/default/dark",
			files: [],
		},
	};
}
