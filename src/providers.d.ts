export namespace BTTV {
    export interface UserResponse {
        channelEmotes: BTTV.Emote[];
        sharedEmotes: BTTV.Emote[];
    }

    export interface EmoteSet {
        id: string;
        channel: string;
        type: SetType;
        emotes: Emote[];
    } 

    export interface Emote {
        id: string;
        code: string;
        imageType: "png" | "gif";
        userId: string;
    }

    export const ZeroWidth = [
        'SoSnowy', 'IceCold', 'SantaHat', 'TopHat',
        'ReinDeer', 'CandyCane', 'cvMask', 'cvHazmat',
    ];

    export type SetType = "Global" | "Channel" | "Shared"
}

export namespace FFZ {
    export interface RoomResponse {
        sets: {
            [key: string]: {
                emoticons: FFZ.Emote[];
            }
        };
    }

    export interface Emote {
        id: number;
        name: string;
        height: number;
        width: number;
        public: boolean;
        hidden: boolean;
        owner: {
            _id: number;
            name: string;
            display_name: string;
        } | null;
        urls: {
            '1': string;
            '2': string;
            '4': string;
        };
    }
}