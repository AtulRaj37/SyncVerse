"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("./db/prisma");
const RoomManager_1 = require("./services/RoomManager");
const auth_1 = __importDefault(require("./routes/auth"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const media_1 = __importDefault(require("./routes/media"));
const users_1 = __importDefault(require("./routes/users"));
const playlists_1 = __importDefault(require("./routes/playlists"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/rooms', rooms_1.default);
app.use('/api/media', media_1.default);
app.use('/api/users', users_1.default);
app.use('/api/playlists', playlists_1.default);
// Serve uploads statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
const server = http_1.default.createServer(app);
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
// Initialize Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const pubClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL
});
pubClient.on("error", (err) => {
    console.error("Redis error:", err);
});
const subClient = pubClient.duplicate();
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    console.log('Redis adapter connected to Socket.IO');
});
// Middleware: Authenticate Socket connections
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token)
        return next(new Error('Authentication error: Token missing'));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Fetch profile inject to socket data
        const user = await prisma_1.prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user)
            return next(new Error('Authentication error: User not found'));
        socket.data.user = {
            userId: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl || null,
        };
        next();
    }
    catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.data.user?.name})`);
    socket.on('C2S_JOIN_ROOM', async (roomId, profile) => {
        // 1. Check if room exists in memory, or DB
        let roomState = RoomManager_1.roomManager.getRoom(roomId);
        if (!roomState) {
            const dbRoom = await prisma_1.prisma.room.findUnique({ where: { id: roomId } });
            if (!dbRoom) {
                socket.emit('S2C_ERROR', 'Room not found');
                return;
            }
            // Initialize in memory
            roomState = RoomManager_1.roomManager.createRoom(dbRoom.id, dbRoom.hostId);
        }
        // *** Room Capacity Limit: max 10 users ***
        if (Object.keys(roomState.users).length >= 10) {
            socket.emit('S2C_ROOM_FULL');
            return;
        }
        // 2. Add user to room state
        // Sanitize incoming profile to prevent nulls from local storage overriding DB data
        const sanitizedProfile = { ...profile };
        Object.keys(sanitizedProfile).forEach(key => {
            if (sanitizedProfile[key] === null || sanitizedProfile[key] === undefined) {
                delete sanitizedProfile[key];
            }
        });
        const userState = {
            userId: socket.data.user.userId,
            socketId: socket.id,
            profile: {
                ...socket.data.user,
                ...sanitizedProfile
            },
            status: 'SYNCED',
            lastPing: Date.now()
        };
        RoomManager_1.roomManager.addUserToRoom(roomId, userState);
        socket.join(roomId);
        // 3. Emit full state to joiner, notify others
        socket.emit('S2C_ROOM_STATE', RoomManager_1.roomManager.getRoom(roomId));
        socket.to(roomId).emit('S2C_USER_JOINED', userState);
        // Save active roomId to socket data for disconnect handling
        socket.data.activeRoomId = roomId;
    });
    socket.on('C2S_SYNC_TIME', (clientSendTime) => {
        socket.emit('S2C_SYNC_PONG', Date.now());
    });
    socket.on('C2S_MEDIA_CMD', (command, time) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (!room)
            return;
        // Enforce DJ Mode (Host Only Controls)
        if (room.settings.djMode && room.hostId !== userId) {
            return; // Ignore command from non-host
        }
        const statusMap = {
            'PLAY': 'PLAYING',
            'PAUSE': 'PAUSED',
            'SEEK': room.status // Seeking usually doesn't change play state
        };
        const newStatus = statusMap[command];
        RoomManager_1.roomManager.updatePlayback(roomId, time, newStatus);
        io.to(roomId).emit('S2C_PLAYBACK_UPDATE', {
            status: newStatus,
            currentTime: time,
            updatedAt: Date.now(),
            playbackRate: 1.0
        });
    });
    socket.on('C2S_CHANGE_MEDIA', (mediaId, source) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (!room)
            return;
        // Enforce DJ Mode (Host Only Controls)
        if (room.settings.djMode && room.hostId !== userId) {
            return; // Ignore command from non-host
        }
        RoomManager_1.roomManager.updateMedia(roomId, mediaId, source);
        // Save to Watch History
        if (source === 'YOUTUBE' || source === 'SOUNDCLOUD' || source === 'TWITCH' || source === 'LOCAL') {
            prisma_1.prisma.watchHistory.create({
                data: {
                    roomId,
                    mediaUrl: mediaId,
                    title: source, // simplified: storing source as title context
                }
            }).catch(err => console.error('Failed to save watch history:', err));
        }
        // Broadcast entire new state to refresh players
        io.to(roomId).emit('S2C_ROOM_STATE', RoomManager_1.roomManager.getRoom(roomId));
    });
    socket.on('C2S_REPORT_STATE', (state) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room && room.users[userId]) {
            room.users[userId].status = state.status;
            room.users[userId].lastPing = Date.now();
        }
    });
    socket.on('C2S_CHAT_MESSAGE', (data) => {
        const roomId = socket.data.activeRoomId;
        const user = socket.data.user;
        if (!roomId || !user)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (!room)
            return;
        const roomUser = room.users[user.userId];
        if (!roomUser)
            return;
        // Discard empty text if it's a TEXT type
        if (data.type === 'TEXT' && (!data.text || !data.text.trim()))
            return;
        io.to(roomId).emit('S2C_CHAT_MESSAGE', {
            id: data.id || Math.random().toString(36).substr(2, 9),
            userId: user.userId,
            name: roomUser.profile.name,
            avatarUrl: roomUser.profile.avatarUrl,
            text: data.text ? data.text.trim().substring(0, 500) : undefined,
            type: data.type || 'TEXT',
            gifUrl: data.gifUrl,
            timestamp: Date.now()
        });
    });
    socket.on('C2S_SHARE_PLAYLIST', (playlist) => {
        const roomId = socket.data.activeRoomId;
        const user = socket.data.user;
        if (!roomId || !user || !playlist)
            return;
        io.to(roomId).emit('S2C_PLAYLIST_SHARED', {
            username: user.name,
            playlist,
        });
    });
    socket.on('C2S_EMOTE', (emoji) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId || !emoji)
            return;
        // Broadcast instantly, no DB storage needed for floating reactions
        io.to(roomId).emit('S2C_EMOTE', {
            userId,
            emoji
        });
    });
    // --- WebRTC Signaling for Screen Share and Voice/Video ---
    socket.on('C2S_WEBRTC_OFFER', ({ targetUserId, offer }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_WEBRTC_OFFER', { senderId, offer });
        }
    });
    socket.on('C2S_WEBRTC_ANSWER', ({ targetUserId, answer }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_WEBRTC_ANSWER', { senderId, answer });
        }
    });
    socket.on('C2S_WEBRTC_ICE', ({ targetUserId, candidate }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_WEBRTC_ICE', { senderId, candidate });
        }
    });
    // --- Spatial Voice WebRTC ---
    socket.on('C2S_JOIN_VOICE', () => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        io.to(roomId).emit('S2C_USER_JOINED_VOICE', userId);
    });
    socket.on('C2S_LEAVE_VOICE', () => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        io.to(roomId).emit('S2C_USER_LEFT_VOICE', userId);
    });
    socket.on('C2S_VOICE_OFFER', ({ targetUserId, offer }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_VOICE_OFFER', { senderId, offer });
        }
    });
    socket.on('C2S_VOICE_ANSWER', ({ targetUserId, answer }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_VOICE_ANSWER', { senderId, answer });
        }
    });
    socket.on('C2S_VOICE_ICE', ({ targetUserId, candidate }) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId || !targetUserId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        const targetSocketId = room?.users[targetUserId]?.socketId;
        if (targetSocketId) {
            io.to(targetSocketId).emit('S2C_VOICE_ICE', { senderId, candidate });
        }
    });
    socket.on('C2S_UPDATE_QUEUE', (queue) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room) {
            // Enforce DJ Mode
            if (room.settings.djMode && room.hostId !== userId) {
                return;
            }
            room.activeQueue = queue;
            io.to(roomId).emit('S2C_QUEUE_UPDATE', queue);
            io.to(roomId).emit('S2C_ROOM_STATE', room);
        }
    });
    socket.on('C2S_LOCAL_FILE_SELECTED', (data) => {
        const roomId = socket.data.activeRoomId;
        if (!roomId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room && room.currentMedia && room.currentMedia.source === 'LOCAL') {
            room.currentMedia.localFileName = data.fileName;
            room.currentMedia.localFileSize = data.fileSize;
        }
        io.to(roomId).emit('S2C_LOCAL_FILE_SELECTED', data);
        if (room) {
            io.to(roomId).emit('S2C_ROOM_STATE', room);
        }
    });
    socket.on('C2S_TOGGLE_DJ_MODE', (djMode) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId)
            return;
        const room = RoomManager_1.roomManager.getRoom(roomId);
        if (room && room.hostId === userId) {
            room.settings.djMode = djMode;
            io.to(roomId).emit('S2C_ROOM_STATE', RoomManager_1.roomManager.getRoom(roomId));
        }
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (userId && roomId) {
            const roomAlive = RoomManager_1.roomManager.removeUserFromRoom(roomId, userId);
            if (roomAlive) {
                io.to(roomId).emit('S2C_USER_LEFT', userId);
                // Host Failover Logic would be triggered here in Step 6
            }
        }
    });
});
const PORT = parseInt(process.env.PORT || '4000', 10);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncVerse server running on port ${PORT}`);
});
