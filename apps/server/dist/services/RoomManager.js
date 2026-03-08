"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomManager = exports.RoomManager = void 0;
// An in-memory store for active rooms.
// In a fully highly-available production system, this could be backed by Redis JSON.
// But we use an in-memory Map + Redis Pub/Sub (Socket.io Adapter) for simplicity and fast read/writes.
class RoomManager {
    rooms = new Map();
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    createRoom(roomId, hostId) {
        const newRoom = {
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
    addUserToRoom(roomId, user) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.users[user.userId] = user;
    }
    removeUserFromRoom(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        delete room.users[userId];
        // If room is empty, we clean it up from memory
        if (Object.keys(room.users).length === 0) {
            this.rooms.delete(roomId);
            return false; // Room died
        }
        return true; // Room still alive
    }
    updatePlayback(roomId, currentTime, status) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.playback.currentTime = currentTime;
        room.playback.updatedAt = Date.now();
        room.status = status;
    }
    updateMedia(roomId, mediaId, source) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
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
exports.RoomManager = RoomManager;
exports.roomManager = new RoomManager();
