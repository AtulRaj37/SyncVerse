import { RoomState, UserState } from '@syncverse/shared';

// An in-memory store for active rooms.
// In a fully highly-available production system, this could be backed by Redis JSON.
// But we use an in-memory Map + Redis Pub/Sub (Socket.io Adapter) for simplicity and fast read/writes.
export class RoomManager {
    private rooms: Map<string, RoomState> = new Map();

    getRoom(roomId: string): RoomState | undefined {
        return this.rooms.get(roomId);
    }

    createRoom(roomId: string, hostId: string): RoomState {
        const newRoom: RoomState = {
            roomId,
            hostId,
            status: 'IDLE',
            currentMedia: null,
            playback: {
                currentTime: 0,
                updatedAt: Date.now(),
                playbackRate: 1.0,
            },
            users: {},
            settings: {
                djMode: false,
            },
        };

        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    addUserToRoom(roomId: string, user: UserState) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.users[user.userId] = user;
    }

    removeUserFromRoom(roomId: string, userId: string): boolean {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        delete room.users[userId];

        // If room is empty, we clean it up from memory
        if (Object.keys(room.users).length === 0) {
            this.rooms.delete(roomId);
            return false; // Room died
        }

        return true; // Room still alive
    }

    updatePlayback(roomId: string, currentTime: number, status: RoomState['status']) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.playback.currentTime = currentTime;
        room.playback.updatedAt = Date.now();
        room.status = status;
    }

    updateMedia(roomId: string, mediaId: string, source: NonNullable<RoomState['currentMedia']>['source']) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.currentMedia = {
            mediaId,
            source,
            duration: 0 // Duration would be populated by client or external API in a real app
        };

        // Reset playback on new media
        room.status = 'IDLE';
        room.playback = {
            currentTime: 0,
            updatedAt: Date.now(),
            playbackRate: 1.0
        };
    }
}

export const roomManager = new RoomManager();
