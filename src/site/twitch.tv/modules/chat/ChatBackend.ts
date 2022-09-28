import { getEmoteButton, Twitch } from "../..";

export const tools = {
	emoteClick: (() => {}) as Twitch.EmoteButton["props"]["onEmoteClick"]
};

export const sendDummyMessage = (
	controller: Twitch.ChatControllerComponent
) => {
	controller.pushMessage({
		badges: {
			staff: "1"
		},
		user: {
			userDisplayName: "SeventvBackend",
			isIntl: false,
			userLogin: "seventvbackendd",
			userID: "77777777",
			color: "",
			userType: "",
			isSubscriber: false
		},
		messageParts: [
			{
				type: 6,
				content: {
					images: {
						dark: {
							"1x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0",
							"2x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
							"4x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0"
						},
						light: {
							"1x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/1.0",
							"2x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/2.0",
							"4x":
								"https://static-cdn.jtvnw.net/emoticons/v2/25/default/light/3.0"
						},
						themed: true
					},
					alt: "Kappa",
					emoteID: "25"
				}
			},
			{
				type: 0,
				content: " Kappa 123"
			}
		],
		messageBody: "Kappa 123",
		type: 0,
		messageType: 0
	});
};

export const registerEmoteCardOpener = () => {
	const btn = getEmoteButton();
	if (!btn) {
		return;
	}

	// btn.props.onEmoteClick({ emoteID: "25", initialTopOffset: 300 });

	tools.emoteClick = btn.props.onEmoteClick;
};
