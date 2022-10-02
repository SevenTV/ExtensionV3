interface Emote {
	id: ObjectID;
	name: string;
	flags: EmoteFlags;
	tags: string[];
	lifecycle: EmoteLifecycle;
	listed: boolean;
	animated: boolean;
	owner: User;
	host: ImageHost;
	versions: EmoteVersion[];
}

interface EmoteVersion {
	id: string;
	name: string;
	description: string;
	lifecycle: EmoteLifecycle;
	listed: boolean;
	animated: boolean;
	host: ImageHost;
}

enum EmoteLifecycle {
	FAILED = -2,
	DELETED,
	PENDING,
	PROCESSING,
	DISABLED,
	LIVE,
	FAILED,
}

enum EmoteFlags {
	PRIVATE = 1 << 0,
	AUTHENTIC = 1 << 1,
	ZERO_WIDTH = 1 << 8,
}

interface EmoteSet {
	id: ObjectID;
	name: string;
	tags: string[];
	immutable: boolean;
	privileged: boolean;
	emotes: ActiveEmote[];
}

interface ActiveEmote {
	id: ObjectID;
	name: string;
	flags: number;
	timestamp: number;
	actor_id: ObjectID;
}

interface ImageHost {
	url: string;
	files: ImageFile[];
}

interface ImageFile {
	name: string;
	static_name: string;
	width: number;
	height: number;
	frame_count?: number;
	size?: number;
	format: ImageFormat;
}

type ImageFormat = "AVIF" | "WEBP";

type ObjectID = string;
