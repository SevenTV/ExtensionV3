import { getChatLine, getEmoteButton, Twitch } from "../..";

export const tools = {
	emoteClick: (() => {}) as Twitch.EmoteButton["props"]["onEmoteClick"],
};

export const sendDummyMessage = (controller: Twitch.ChatControllerComponent) => {
	controller.pushMessage({
		badges: {},
		user: {
			userDisplayName: "",
			isIntl: false,
			userLogin: "7tvapp",
			userID: "77777777",
			color: "",
			userType: "",
			isSubscriber: false,
		},
		messageParts: [
			{
				type: 6,
				content: {
					images: {
						dark: {
							"1x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0",
							"2x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
							"4x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0",
						},
						light: {
							"1x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/1.0",
							"2x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/2.0",
							"4x": "https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/3.0",
						},
						themed: true,
					},
					alt: "",
					emoteID: "-1",
				},
			},
		],
		messageBody: "",
		type: 0,
		messageType: 0,
		id: "seventv-hook-message",
	});
};

export const registerEmoteCardCardOpener = (): boolean => {
	const btn = getEmoteButton();
	if (!btn) {
		return false;
	}

	tools.emoteClick = btn.props.onEmoteClick;

	return true;
};
