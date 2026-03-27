export interface RoomState {
    roomId: string;
    hostId: string;
    status: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING';

    currentMedia: {
        mediaId: string;
        source: 'YOUTUBE' | 'SOUNDCLOUD' | 'TWITCH' | 'LOCAL' | 'SCREEN';
        duration: number;
        localFileName?: string;
        localFileSize?: number;
    } | null;

    playback: {
        currentTime: number;
        updatedAt: number;
        playbackRate: number;
    };

    users: Record<string, UserState>;

    settings: {
        djMode: boolean;
    };

    activeQueue: {
        playlist: SharedPlaylist;
        trackIndex: number;
    } | null;
}

export interface UserState {
    userId: string;
    socketId: string;
    profile: { name: string; avatarUrl: string; bio?: string | null; createdAt?: string | null };
    status: 'SYNCED' | 'DRIFTING' | 'BUFFERING' | 'DISCONNECTED';
    lastPing: number;
}

// Playlist shared types
export interface SharedTrack {
    id: string;
    title: string;
    mediaId: string;
    source: string;
    duration?: number | null;
    position: number;
}

export interface SharedPlaylist {
    id: string;
    name: string;
    tracks: SharedTrack[];
}

// Server to Client Events
export interface ServerToClientEvents {
    S2C_ROOM_STATE: (state: RoomState) => void;
    S2C_PLAYBACK_UPDATE: (data: { status: RoomState['status'], currentTime: number, updatedAt: number, playbackRate: number }) => void;
    S2C_USER_JOINED: (user: UserState) => void;
    S2C_USER_LEFT: (userId: string) => void;
    S2C_EMOTE: (data: { userId: string, emoji: string }) => void;
    S2C_HOST_CHANGED: (hostId: string) => void;
    S2C_QUEUE_UPDATE: (queue: { playlist: SharedPlaylist, trackIndex: number } | null) => void;
    S2C_SYNC_PONG: (serverTime: number) => void;
    S2C_ERROR: (message: string) => void;
    S2C_ROOM_FULL: () => void;
    S2C_CHAT_MESSAGE: (data: { id: string, userId?: string, name?: string, avatarUrl?: string | null, text?: string, timestamp?: number, type?: 'TEXT' | 'EMOJI' | 'GIF', gifUrl?: string }) => void;
    S2C_LOCAL_FILE_SELECTED: (data: { fileName: string, fileSize: number }) => void;
    S2C_WEBRTC_OFFER: (data: { senderId: string, offer: any }) => void;
    S2C_WEBRTC_ANSWER: (data: { senderId: string, answer: any }) => void;
    S2C_WEBRTC_ICE: (data: { senderId: string, candidate: any }) => void;
    S2C_PLAYLIST_SHARED: (data: { username: string; playlist: SharedPlaylist }) => void;

    // Spatial Voice WebRTC
    S2C_VOICE_OFFER: (data: { senderId: string, offer: any }) => void;
    S2C_VOICE_ANSWER: (data: { senderId: string, answer: any }) => void;
    S2C_VOICE_ICE: (data: { senderId: string, candidate: any }) => void;
    S2C_USER_JOINED_VOICE: (userId: string) => void;
    S2C_USER_LEFT_VOICE: (userId: string) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
    C2S_SYNC_TIME: (clientSendTime: number) => void;
    C2S_JOIN_ROOM: (roomId: string, profile: UserState['profile']) => void;
    C2S_MEDIA_CMD: (command: 'PLAY' | 'PAUSE' | 'SEEK', time: number) => void;
    C2S_EMOTE: (emoji: string) => void;
    C2S_REPORT_STATE: (state: { currentTime: number, status: UserState['status'] }) => void;
    C2S_CHAT_MESSAGE: (data: { id?: string, text?: string, type?: 'TEXT' | 'EMOJI' | 'GIF', gifUrl?: string }) => void;
    C2S_CHANGE_MEDIA: (mediaId: string, source: 'YOUTUBE' | 'SOUNDCLOUD' | 'TWITCH' | 'LOCAL' | 'SCREEN') => void;
    C2S_LOCAL_FILE_SELECTED: (data: { fileName: string, fileSize: number }) => void;
    C2S_WEBRTC_OFFER: (data: { targetUserId: string, offer: any }) => void;
    C2S_UPDATE_QUEUE: (queue: { playlist: SharedPlaylist, trackIndex: number } | null) => void;
    C2S_WEBRTC_ANSWER: (data: { targetUserId: string, answer: any }) => void;
    C2S_WEBRTC_ICE: (data: { targetUserId: string, candidate: any }) => void;
    C2S_SHARE_PLAYLIST: (playlist: SharedPlaylist) => void;
    C2S_TOGGLE_DJ_MODE: (djMode: boolean) => void;

    // Spatial Voice WebRTC
    C2S_VOICE_OFFER: (data: { targetUserId: string, offer: any }) => void;
    C2S_VOICE_ANSWER: (data: { targetUserId: string, answer: any }) => void;
    C2S_VOICE_ICE: (data: { targetUserId: string, candidate: any }) => void;
    C2S_JOIN_VOICE: () => void;
    C2S_LEAVE_VOICE: () => void;
}
