import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { RoomState, ServerToClientEvents, ClientToServerEvents, UserState } from '@syncverse/shared';

export interface ChatMessage {
    userId: string;
    name: string;
    text: string;
    timestamp: number;
}

interface SocketStore {
    socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
    isConnected: boolean;
    roomState: RoomState | null;
    chatMessages: ChatMessage[];
    error: string | null;

    connect: (token: string, roomId: string, profile: UserState['profile']) => void;
    disconnect: () => void;
    sendMediaCommand: (command: 'PLAY' | 'PAUSE' | 'SEEK', time: number) => void;
    reportState: (currentTime: number, status: 'SYNCED' | 'DRIFTING' | 'BUFFERING') => void;
    sendChatMessage: (text: string) => void;
    sendEmote: (emoji: string) => void;
    changeMedia: (mediaId: string, source: 'YOUTUBE' | 'SOUNDCLOUD' | 'LOCAL') => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
    socket: null,
    isConnected: false,
    roomState: null,
    chatMessages: [],
    error: null,

    connect: (token, roomId, profile) => {
        // Prevent duplicate connections
        if (get().socket) return;

        const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(process.env.NEXT_PUBLIC_API_URL!, {
            auth: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            set({ isConnected: true, error: null });
            socket.emit('C2S_JOIN_ROOM', roomId, profile);
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('connect_error', (err) => {
            set({ error: err.message });
        });

        socket.on('S2C_ERROR', (msg) => {
            set({ error: msg });
        });

        // Handle full state dump (on join)
        socket.on('S2C_ROOM_STATE', (state) => {
            set({ roomState: state });
        });

        // Handle playback changes
        socket.on('S2C_PLAYBACK_UPDATE', (data) => {
            set((state) => {
                if (!state.roomState) return state;
                return {
                    roomState: {
                        ...state.roomState,
                        status: data.status,
                        playback: {
                            currentTime: data.currentTime,
                            updatedAt: data.updatedAt,
                            playbackRate: data.playbackRate
                        }
                    }
                };
            });
        });

        // Handle roster updates
        socket.on('S2C_USER_JOINED', (user) => {
            set((state) => {
                if (!state.roomState) return state;
                return {
                    roomState: {
                        ...state.roomState,
                        users: { ...state.roomState.users, [user.userId]: user }
                    }
                };
            });
        });

        socket.on('S2C_USER_LEFT', (userId) => {
            set((state) => {
                if (!state.roomState) return state;
                const newUsers = { ...state.roomState.users };
                delete newUsers[userId];
                return {
                    roomState: {
                        ...state.roomState,
                        users: newUsers
                    }
                };
            });
        });

        socket.on('S2C_CHAT_MESSAGE', (msg) => {
            set((state) => ({
                chatMessages: [...state.chatMessages, msg]
            }));
        });

        // NOTE: S2C_EMOTE will be handled via an event bus or direct React state inside the Player 
        // to avoid triggering full Zustand re-renders for 60fps animations.

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false, roomState: null });
        }
    },

    sendMediaCommand: (command, time) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('C2S_MEDIA_CMD', command, time);
        }
    },

    reportState: (currentTime, status) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('C2S_REPORT_STATE', { currentTime, status });
        }
    },

    sendChatMessage: (text) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('C2S_CHAT_MESSAGE', text);
        }
    },

    sendEmote: (emoji) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('C2S_EMOTE', emoji);
        }
    },

    changeMedia: (mediaId, source) => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.emit('C2S_CHANGE_MEDIA', mediaId, source);
        }
    }
}));
