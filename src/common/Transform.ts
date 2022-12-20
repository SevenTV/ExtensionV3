const BTTV_ZeroWidth = [
	'SoSnowy', 'IceCold', 'SantaHat', 'TopHat',
	'ReinDeer', 'CandyCane', 'cvMask', 'cvHazmat',
]

export function convertSeventvGlobalConnection(data: SevenTV.EmoteSet): SevenTV.UserConnection {
	return {
		id: data.id,
		platform: "TWITCH",
		username: data.name,
		display_name: data.name,
		linked_at: 0,
		emote_capacity: 50,
		emote_set: data,
		provider: "7TV"
	};
}

export function convertTwitchEmoteSet(data: Twitch.TwitchEmoteSet): SevenTV.EmoteSet {
	return {
		id: data.id,
		name: "TwitchSet#" + data.id,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "TWITCH",
		emotes: data.emotes.map((e) => ({
			id: e.id,
			name: e.token,
			flags: 0,
			provider: "TWITCH",
			data: convertTwitchEmote(e),
		})),
	};
}

export function convertTwitchEmote(data: Partial<Twitch.TwitchEmote>): SevenTV.Emote {
	return {
		id: data.id ?? "",
		name: data.token ?? "",
		flags: 0,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "https://static-cdn.jtvnw.net/emoticons/v2/" + data.id + "/default/dark",
			files: [
				{
					name: "1.0",
					format: "PNG",
				},
				{
					name: "2.0",
					format: "PNG",
				},
				{
					name: "3.0",
					format: "PNG",
				},
				{
					name: "4.0",
					format: "PNG",
				},
			],
		},
	};
}

export function convertBttvEmoteSet(data: BTTV.EmoteSet): SevenTV.EmoteSet {
	return {
		id: data.id,
		name: "BttvSet#" + data.id,
		immutable: true,
		privileged: true,
		tags: [],
		provider: "BTTV",
		emotes: data.emotes.map((e) => ({
			id: e.id,
			name: e.code,
			flags: e.code in BTTV_ZeroWidth ? 0 : 256,
			provider: "BTTV",
			data: convertBttvEmote(e),
		})),
	};
}

export function convertBttvEmote(data: BTTV.Emote): SevenTV.Emote {
	return {
		id: data.id,
		name: data.code,
		flags: data.code in BTTV_ZeroWidth ? 0 : 256,
		tags: [],
		lifecycle: 3,
		listed: true,
		owner: null,
		host: {
			url: "https://cdn.betterttv.net/emote/" + data.id,
			files: [
				{
					name: "1x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
				{
					name: "2x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
				{
					name: "3x",
					format: data.imageType.toUpperCase() as SevenTV.ImageFormat,
				},
			],
		},
	}
}

export function convertBttvUserConnection(data: BTTV.UserResponse, id: string): SevenTV.UserConnection {
	return {
		id: "BTTV#" + id,
		platform: "TWITCH",
		username: "",
		display_name: "",
		linked_at: 0,
		emote_capacity: data.channelEmotes.length,
		emote_set: convertBttvEmoteSet({
			id: id,
			channel: data.id,
			type: "Channel",
			emotes: data.channelEmotes
		}),
		provider: "BTTV"
	}
}