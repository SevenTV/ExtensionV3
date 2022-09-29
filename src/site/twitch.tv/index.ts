export function findReactParents(
	node: any,
	predicate: Twitch.FindReactInstancePredicate,
	maxDepth = 15
): Twitch.AnyPureComponent | null {
	let travel = 0;
	while (node && travel <= maxDepth) {
		try {
			let match = predicate?.(node);
			if (match) return node;
		}
		catch (e) {}

		node = node.return;
		travel++;
	}

	return null;
}

export function findReactChildren(
	node: any,
	predicate: Twitch.FindReactInstancePredicate,
	maxDepth = 15
): Twitch.AnyPureComponent | null {
	let path: any[] = [];

	for (;;) {
		if (!node || path.length > maxDepth) {
			let parent = path.pop();
			if (parent) {
				node = parent.sibling;
				continue;
			}
			else {
				break;
			}
		}

		try {
			let match = predicate?.(node);
			if (match) return node;
		}
		catch (e) {}

		path.push(node);
		node = node.child || node.sibling;
	}

	return null;
}

export function getReactInstance(
	el: Element | null
): (React.Component & { [x: string]: any }) | undefined {
	for (const k in el) {
		if (k.startsWith("__reactInternalInstance$")) {
			return (el as any)[k] as any;
		}
	}
}

export function getRouter(): Twitch.RouterComponent {
	const node = findReactChildren(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.MainLayout)[0]
		),
		n => n.stateNode?.props?.history?.listen,
		100
	);

	return node?.stateNode;
}

export function getUser(): Twitch.UserComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelector("button[data-a-target='user-menu-toggle']")
		),
		n => n.stateNode?.props?.user,
		100
	);

	return node?.stateNode;
}

export function getChatService(): Twitch.ChatServiceComponent {
	const node = findReactChildren(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.MainLayout)[0]
		),
		n => n.stateNode?.join && n.stateNode?.client,
		500
	);

	return node?.stateNode;
}

export function getChatController(): Twitch.ChatControllerComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.ChatContainer)[0]
		),
		n =>
			n.stateNode?.props.messageHandlerAPI &&
			n.stateNode?.props.chatConnectionAPI,
		100
	);

	return node?.stateNode;
}

export function getChatMessageContainer(): Twitch.AnyPureComponent {
	const node = findReactParents(
		getReactInstance(document.querySelector(".chat-list--default")),
		n => n.stateNode && n.stateNode.props && n.stateNode.props.messages,
		100
	);

	return node?.stateNode;
}

/**
 * Gets the channel's id and display name for a video.
 * Note: VOD and clips do not have the channel name in
 * the URL nor do they contain a chat controller with the info.
 */
export function getVideoChannel(): Twitch.VideoChannelComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.VideoChatContainer)[0]
		),
		n => n.stateNode?.props.channelID && n.stateNode?.props.displayName,
		100
	);

	// Kinda hacky? However, display names are merely
	// case variations of the pure lowercase channel logins.
	if (node?.stateNode?.props) {
		node.stateNode.props.channelLogin = node.stateNode.props.displayName.toLowerCase();
	}

	return node?.stateNode;
}

export function getChatScroller(): Twitch.ChatScrollerComponent {
	const node = findReactParents(
		getReactInstance(document.querySelector(".scrollable-area")),
		n => n.stateNode.props["data-a-target"] === ("chat-scroller" as any),
		10
	);

	return node?.stateNode;
}

export function getChat(): Twitch.ChatComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.ChatContainer)[0]
		),
		n => n.stateNode?.props.onSendMessage
	);

	return node?.stateNode;
}

/**
 * Gets info for the VOD or clip, including the video id, playback location, and current messages/comments.
 */
export function getVideoChat(): Twitch.VideoChatComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelectorAll(Twitch.Selectors.VideoChatContainer)[0]
		),
		n => n.stateNode?.props.comments && n.stateNode?.props.onCreate,
		5
	);

	return node?.stateNode;
}

export function getInputController(): Twitch.ChatInputController {
	const node = findReactParents(
		getReactInstance(document.querySelectorAll("div.chat-input")[0]),
		n => n.stateNode?.props.onSendMessage
	);
	return node?.stateNode;
}

export function getChatInput(): Twitch.ChatInputComponent {
	return getAutocompleteHandler()?.componentRef;
}

export function getAutocompleteHandler(): Twitch.ChatAutocompleteComponent {
	const node = findReactChildren(
		getReactInstance(document.querySelector(".chat-input__textarea")),
		n => n.stateNode.providers
	);

	return node?.stateNode;
}

export function getEmotePicker(): Twitch.AnyPureComponent {
	const node = findReactParents(
		getReactInstance(
			document.querySelector("[data-a-target=emote-picker]")
		),
		n => !(n.stateNode instanceof HTMLElement) && n.stateNode !== null
	);

	return node as any;
}

/**
 * Get an individual chat line
 */
export function getChatLine(el: HTMLElement): Twitch.ChatLineAndComponent {
	const inst = getReactInstance(el);

	return {
		component: inst?.return?.stateNode,
		inst: inst as Twitch.TwitchPureComponent,
		element: inst?.stateNode
	};
}

/**
 * Get chat lines with the element & react component, optionally filtered by an ID list
 */
export function getChatLines(idList?: string[]): Twitch.ChatLineAndComponent[] {
	let lines = Array.from(
		document.querySelectorAll<HTMLElement>(Twitch.Selectors.ChatLine)
	).map(element => {
		const chatLine = getChatLine(element);

		return {
			element,
			component: chatLine.component,
			inst: chatLine.inst
		};
	});

	if (!!idList) {
		lines = lines.filter(({ component }) =>
			idList?.includes((component?.props as any)?.message?.id)
		);
	}

	return lines as Twitch.ChatLineAndComponent[];
}

export function getEmoteButton(): Twitch.EmoteButton {
	const node = findReactParents(
		getReactInstance(
			document.querySelector("[data-test-selector='emote-button']")
		),
		n => n.stateNode?.props?.onEmoteClick,
		10
	);

	return node?.stateNode;
}

export namespace Twitch {
	export namespace Selectors {
		export const ROOT = "#root div";
		export const NAV = '[data-a-target="top-nav-container"]';
		export const MainLayout =
			'main.twilight-main, #root.sunlight-root > div:nth-of-type(3), #root[data-a-page-loaded-name="PopoutChatPage"] > div, #root[data-a-page-loaded-name="ModerationViewChannelPage"] > div:nth-of-type(1)';
		export const ChatContainer =
			'section[data-test-selector="chat-room-component-layout"]';
		export const VideoChatContainer = "div.video-chat.va-vod-chat";
		export const ChatScrollableContainer =
			".chat-scrollable-area__message-container";
		export const ChatLine = ".chat-line__message";
		export const VideoChatMessage =
			".vod-message > div:not(.vod-message__header) > div";
		export const ChatInput = ".chat-input__textarea";
		export const ChatInputButtonsContainer =
			'div[data-test-selector="chat-input-buttons-container"]';
		export const ChatMessageContainer = ".chat-line__message-container";
		export const ChatUsernameContainer = ".chat-line__username-container";
		export const ChatAuthorDisplayName = ".chat-author__display-name";
		export const ChatMessageBadges = ".chat-line__message--badges";
		export const ChatMessageUsername = ".chat-line__usernames";
		export const ChatMessageTimestamp = ".chat-line__timestamp";
	}

	export type FindReactInstancePredicate = (node: any) => boolean;
	export type AnyPureComponent = React.PureComponent & { [x: string]: any };
	export interface TwitchPureComponent extends AnyPureComponent {
		child: TwitchPureComponent;
		alternate: TwitchPureComponent;
		childExpirationTime: number;
		dependencies: any;
		effectTag: number;
		elementType: string;
		expirationTime: number;
		firstEffect: any;
		index: number;
		key: any;
		lastEffect: any;
		memoizedProps: any;
		pendingProps: any;
		mode: number;
		nextEffect: any;
		ref: any;
		return: TwitchPureComponent | AnyPureComponent;
		tag: number;
		type: string;
		updateQueue: any;
	}

	export interface ChatLineAndComponent {
		element?: HTMLDivElement;
		inst: TwitchPureComponent;
		component: ChatLineComponent;
	}

	export interface VideoChatLineAndComponent {
		element?: HTMLDivElement;
		inst: TwitchPureComponent;
		component: VideoChatComponent;
	}

	export type ChatLineComponent = React.PureComponent<{
		badgeSets: BadgeSets;
		channelID: string;
		channelLogin: string;
		confirmModerationAction: Function;
		currentUserDisplayName: string;
		currentUserID: string;
		currentUserLogin: string;
		deletedCount: number | undefined;
		deletedMessageDisplay: string;
		hasReply: string | undefined;
		hideBroadcasterTooltip: boolean | undefined;
		hideViewerCard: Function;
		isCurrentUserModerator: boolean;
		isCurrentUserStaff: boolean;
		isDeleted: boolean;
		isHidden: boolean;
		isHistorical: boolean | undefined;
		message: ChatMessage;
		onHiddenMessageClick: Function;
		onUsernameClick: Function;
		repliesAppearencePreference: string;
		reply: string | undefined;
		setTray: Function;
		setViewerCardPage: Function;
		showModerationIcons: boolean;
		showTimestamps: boolean;
		theme: number;
		tooltipLayer: {
			show: Function;
			showRich: Function;
			hide: Function;
		};
		useHighContrastColors: boolean;
	}> & {
		openViewerCard: (e: any) => void;
	};

	export type EmoteButton = React.Component<{}> & {
		props: {
			onEmoteClick: (emote: {
				emoteID: string;
				initialTopOffset: number;
			}) => void;
		};
	};

	export type VideoMessageComponent = React.PureComponent<{
		badgeSets: BadgeSets;
		context: VideoChatCommentContext;
		currentUser: { id: string };
		isCurrentUserModerator: boolean;
		isExpandedLayout: boolean;
	}>;

	export type RouterComponent = React.PureComponent<{
		// React history object used for navigating.
		history: {
			action: string;
			goBack: () => void;
			goForward: () => void;
			listen: (
				handler: (location: Location, action: string) => void
			) => void;
			location: Location;
		};
		location: Location;
		isLoggedIn: boolean;
		match: {
			isExact: boolean;
			params: { [key: string]: string };
			path: string;
			url: string;
		};
	}>;

	export type UserComponent = React.Component<{
		user: {
			id: string;
			login: string;
			displayName: string;
			authToken?: string;
		};
	}>;

	export type ChatServiceComponent = React.PureComponent<{
		authToken: string;
		currentUserLogin: string;
		channelLogin: string;
		channelID: string;
	}> & {
		client: {
			connection: {
				ws: WebSocket;
			};
		};
		service: {
			client: {
				events: {
					joined: (
						fn: (x: {
							channel: string;
							gotUsername: boolean;
							username: string;
						}) => void
					) => void;
				};
			};
		};
	};

	export type ChatControllerComponent = React.PureComponent<{
		authToken: string | undefined;
		channelDisplayName: string;
		channelID: string;
		channelLogin: string;
		chatConnectionAPI: {
			sendMessage: Function;
		};
		chatRules: string[];
		clientID: string;
		firstPageLoaded: boolean;
		followerModeDuration: number;
		initialStateLoaded: boolean;
		inlineRightColumnExpanded: boolean;
		isBackground: boolean | undefined;
		isChatRulesOpen: boolean;
		isCurrentUserEditor: boolean;
		isCurrentUserModerator: boolean;
		isCurrentUserVIP: boolean;
		isEmbedded: boolean;
		isHidden: boolean;
		isInspecting: boolean;
		isLoggedIn: boolean;
		isPopout: boolean;
		isReadOnly: boolean | undefined;
		isStaff: boolean;
		messageHandlerAPI: {
			addMessageHandler: (event: (msg: ChatMessage) => void) => void;
			removeMessageHandler: (event: (msg: ChatMessage) => void) => void;
			handleMessage: (msg: ChatMessage) => void;
		};
		rightColumnExpanded: boolean;
		rootTrackerExists: boolean;
		shouldConnectChat: boolean | undefined;
		shouldSeeBlockedAndDeleteMessages: boolean;
		slowModeDuration: number;
		slowModeEnabled: boolean;
		theme: number;
		userDisplayName: string | undefined;
		userID: string | undefined;
		userLogin: string | undefined;
	}> & {
		pushMessage: (msg: Partial<ChatMessage>) => void;
		sendMessage: (msg: string, n?: any) => void;
	};

	export type VideoChannelComponent = React.PureComponent<{
		channelID: string;
		displayName: string;
		channelLogin: string;
	}>;

	export type ChatScrollerComponent = React.PureComponent<{}> & {
		onScroll: (e: Event) => void;
	};

	export type ChatComponent = React.PureComponent<
		{
			authToken: string;
			bitsConfig: BitsConfig;
			bitsEnabled: boolean;
			channelDisplayName: string;
			channelID: string;
			channelLogin: string;
			chatRoomHeader: any;
			chatRules: string[];
			chatView: number;
			emotes: TwitchEmoteSet[];
			location: {
				hash: string;
				pathname: string;
				search: string;
				state: any;
			};
			userBadges: { [key: string]: "1" | "0" };
			userID: string;
		},
		{
			badgeSets: BadgeSets;
			chatListElement: HTMLDivElement;
		}
	>;

	export type VideoChatComponent = React.PureComponent<{
		bitsConfig: BitsConfig;
		blockedUsers: {
			[key: string]: boolean;
		};
		comments: VideoChatCommentContext[];
		currentVideoTime: number;
		onBanUser: (n: any) => void;
		onCreate: (n: any) => void;
		onDeleteComment: (n: any) => void;
		videoID: string;
	}>;

	export type ChatInputController = React.Component<{
		sendMessageErrorChecks: Record<
			"duplicated-messages" | "message-throughput",
			{
				check: (value: string) => any;
				onMessageSent: (x: any) => any;
			}
		>;
		chatConnectionAPI: {
			sendMessage: Function;
		};
	}> & {
		props: {
			onSendMessage: (
				value: string,
				reply: {
					parentDeleted: boolean;
					parentDisplayName: string;
					parentMessageBodsy: string;
					parentMsgId: string;
					parentUid: string;
					parentUserLogin: string;
				}
			) => any;
		};
	};

	export type ChatInputComponent = React.Component<{
		channelID: string;
		channelLogin: string;
		setInputValue: (v: string) => void;
		onFocus: (v: any) => void;
		onChange: (v: any) => void;
		onKeyDown: (v: any) => void;
		onValueUpdate: (v: any) => void;
		value: string;
	}> & { selectionStart: number };

	export type ChatAutocompleteComponent = {
		componentRef: Twitch.ChatInputComponent;
		getMatches: (v: string) => TwitchEmote[];
		props: {
			channelID: string;
			channelLogin: string;
			clearModifierTray: () => void;
			clearReplyToList: () => void;
			closeCard: () => void;
			closeKeyboardReplyTray: () => void;
			currentUserDisplayName: string;
			currentUserID: string;
			currentUserLogin: string;
			emotes: TwitchEmoteSet[];
			isCurrentUserEditor: boolean;
			isCurrentUserModerator: boolean;
			isCurrentUserStaff: boolean;
			messageBufferAPI: any;
			onFocus: (v: any) => any;
			onKeyDown: (v: any) => any;
			onMatch: (e: any, t: any, i: any) => any;
			onReset: (v: any) => any;
			onValueUpdate: (v: any) => any;
			setInputValue: (v: any) => any;
			setModifierTray: (v: any) => any;
			setReplyToList: (v: any) => any;
			setTray: (v: any) => any;
			showModerationIcons: boolean;
			showTimestamps: boolean;
			tray: any;
			useHighContrastColors: boolean;
		};
		providers: Provider[];
	};

	export type Provider = {
		autocompleteType: string;
		canBeTriggeredByTab: boolean;
		doesEmoteMatchTerm: (e: TwitchEmote, t: string) => boolean;
		getMatchedEmotes: (s: string) => TwitchEmote[];
		getMatches: (x: string) => any[];
		props: {
			emotes: TwitchEmoteSet[];
			isEmoteAnimationsEnabled: boolean;
			registerAutocompleteProvider: (p: Provider) => void;
			theme: Theme;
		};
		renderEmoteSuggestion: (e: TwitchEmote) => TwitchEmote;
		hydrateEmotes: (
			emotes: any,
			b: boolean,
			theme: Twitch.Theme
		) => Twitch.TwitchEmoteSet[];
	};

	export enum Theme {
		"Light",
		"Dark"
	}

	// Standard React location object.
	export interface Location {
		hash: string;
		key: string;
		pathname: string;
		search: string;
		state?: {
			content: string;
			medium: string;
			freeform_tag_filter?: string;
			previous_search_query_id?: string;
			search_query_id?: string;
			search_session_id?: string;
		};
	}

	export interface BitsConfig {
		getImage: (n: any, i: any, a: any, r: any, s: any) => any;
		indexedActions: {
			[key: string]: {
				id: string;
				prefix: string;
				type: string;
				campaign: string | null;
				tiers: {
					id: string;
					bits: number;
					canShowInBitsCard: boolean;
					__typename: string;
				};
				template: string;
				__typename: string;
			};
		};
	}

	export interface EmoteCardOpener {
		onShowEmoteCard: (v: any) => void;
	}

	export interface TwitchEmoteSet {
		id: string;
		emotes: TwitchEmote[];
		owner?: {
			displayName: string;
			id: string;
			login: string;
			profileImageURL: string;
		};
		__typename?: string;
	}

	export interface TwitchEmote {
		id: string;
		modifiers?: any;
		setID: string;
		displayName?: string;
		token: string;
		type: string;
		owner?: {
			displayName: string;
			id: string;
			login: string;
			profileImageURL: string;
		};
		__typename?: string;
		_thirdPartyGlobal: boolean;
		srcSet?: string;
	}

	export interface BadgeSets {
		channelsBySet: Map<string, Map<string, ChatBadge>>;
		count: number;
		globalsBySet: Map<string, Map<string, ChatBadge>>;
	}

	export interface ChatBadge {
		clickAction?: string;
		clickURL?: string;
		click_action?: string;
		click_url?: string;
		id: string;
		image1x: string;
		image2x?: string;
		image4x: string;
		setID: string;
		title: string;
		version: string;
		__typename: string;
	}

	export interface VideoChatComment {
		channelId: string;
		commenter: string;
		contentId: string;
		contentOffset: number;
		contentType: string;
		createdAt: Date;
		id: string;
		message: {
			id: string;
			isAction: boolean;
			tokens: ChatMessage.Part[];
			userColor: string;
			userNoticeParams: {};
		};
		moreReplies: boolean;
		parentId: string;
		source: string;
		state: string;
		userBadges: {
			[key: string]: string;
		};
	}

	export interface VideoChatCommentContext {
		author: {
			bio: string;
			createdAt: Date;
			displayName: string;
			id: string;
			logo: URL;
			name: string;
			type: string;
			updatedAt: Date;
		};
		comment: VideoChatComment;
		lastUpdated: Date;
		replies: [];
	}

	export interface ChatMessage {
		badgesDynamicData: {};
		badges: { [key: string]: "1" | "0" };
		banned: boolean;
		bits: number;
		deleted: boolean;
		hidden: boolean;
		id: string;
		isHistorical: unknown;
		message: string;
		messageBody: string;
		messageParts: ChatMessage.Part[];
		messageType: number;
		type: number;
		reply: unknown;
		user: ChatUser;

		// Other third party things
		ffz_tokens?: {
			big: boolean;
			can_big?: boolean;
			modifiers: any[];
			provider: string;
			src: string;
			src2: string;
			srcSet: string;
			srcSet2: string;
			text: string;
			type: "emote" | "text";
		}[];
		ffz_emotes: any;
		emotes?: any;
		_ffz_checked?: boolean;
		opener?: Twitch.EmoteCardOpener;
	}
	export namespace ChatMessage {
		export interface Part {
			content: string | EmoteRef | { [key: string]: any };
			type: number;
		}

		export interface EmoteRef {
			alt: string;
			emoteID?: string;
			images?: {
				dark: {
					"1x": string;
					"2x": string;
					"3x": string;
					"4x": string;
				};
				light: {
					"1x": string;
					"2x": string;
					"3x": string;
					"4x": string;
				};
				themed: boolean;
			};

			// Only exists if cheermote
			cheerAmount?: number;
			cheerColor?: string;
		}

		export interface AppPart {
			type: "text" | "emote" | "twitch-emote" | "link" | "mention";
			content?: string | { [key: string]: any };
		}

		export interface ModerationMessage {
			duration: number;
			id: string;
			moderationType: number;
			reason: string;
			type: number;
			userLogin: string;
		}
	}

	export interface ChatUser {
		color: string;
		isIntl: boolean;
		isSubscriber: boolean;
		userDisplayName: string;
		userID: string;
		userLogin: string;
		userType: string;
	}
}
