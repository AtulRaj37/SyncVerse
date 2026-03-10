import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { prisma } from './db/prisma';
import { roomManager } from './services/RoomManager';

// Import shared types
import {
    ServerToClientEvents,
    ClientToServerEvents,
} from '@syncverse/shared';

import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import mediaRouter from './routes/media';
import usersRouter from './routes/users';
import playlistsRouter from './routes/playlists';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/users', usersRouter);
app.use('/api/playlists', playlistsRouter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

const server = http.createServer(app);

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

// Initialize Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const pubClient = createClient({
    url: process.env.REDIS_URL
});

pubClient.on("error", (err) => {
    console.error("Redis error:", err);
});

const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter connected to Socket.IO');
});

// Middleware: Authenticate Socket connections
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: Token missing'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

        // Fetch profile inject to socket data
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return next(new Error('Authentication error: User not found'));

        socket.data.user = {
            userId: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl || null,
        };
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.data.user?.name})`);

    socket.on('C2S_JOIN_ROOM', async (roomId, profile) => {
        // 1. Check if room exists in memory, or DB
        let roomState = roomManager.getRoom(roomId);

        if (!roomState) {
            const dbRoom = await prisma.room.findUnique({ where: { id: roomId } });
            if (!dbRoom) {
                socket.emit('S2C_ERROR', 'Room not found');
                return;
            }
            // Initialize in memory
            roomState = roomManager.createRoom(dbRoom.id, dbRoom.hostId);
        }

        // *** Room Capacity Limit: max 10 users ***
        if (Object.keys(roomState.users).length >= 10) {
            socket.emit('S2C_ROOM_FULL');
            return;
        }

        // 2. Add user to room state
        const userState = {
            userId: socket.data.user.userId,
            socketId: socket.id,
            profile: socket.data.user,
            status: 'SYNCED' as const,
            lastPing: Date.now()
        };

        roomManager.addUserToRoom(roomId, userState);
        socket.join(roomId);

        // 3. Emit full state to joiner, notify others
        socket.emit('S2C_ROOM_STATE', roomManager.getRoom(roomId)!);
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
        if (!roomId || !userId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        // Everyone has permission to seek and play/pause

        const statusMap = {
            'PLAY': 'PLAYING',
            'PAUSE': 'PAUSED',
            'SEEK': room.status // Seeking usually doesn't change play state
        } as const;

        const newStatus = statusMap[command];

        roomManager.updatePlayback(roomId, time, newStatus);

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
        if (!roomId || !userId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        // All users have permission to change media

        roomManager.updateMedia(roomId, mediaId, source);

        // Broadcast entire new state to refresh players
        io.to(roomId).emit('S2C_ROOM_STATE', roomManager.getRoom(roomId)!);
    });

    socket.on('C2S_REPORT_STATE', (state) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId) return;

        const room = roomManager.getRoom(roomId);
        if (room && room.users[userId]) {
            room.users[userId].status = state.status;
            room.users[userId].lastPing = Date.now();
        }
    });

    socket.on('C2S_CHAT_MESSAGE', (data) => {
        const roomId = socket.data.activeRoomId;
        const user = socket.data.user;
        if (!roomId || !user) return;

        // Discard empty text if it's a TEXT type
        if (data.type === 'TEXT' && (!data.text || !data.text.trim())) return;

        io.to(roomId).emit('S2C_CHAT_MESSAGE', {
            id: data.id || Math.random().toString(36).substr(2, 9),
            userId: user.userId,
            name: user.name,
            text: data.text ? data.text.trim().substring(0, 500) : undefined,
            type: data.type || 'TEXT',
            gifUrl: data.gifUrl,
            timestamp: Date.now()
        });
    });

    socket.on('C2S_SHARE_PLAYLIST', (playlist) => {
        const roomId = socket.data.activeRoomId;
        const user = socket.data.user;
        if (!roomId || !user || !playlist) return;

        io.to(roomId).emit('S2C_PLAYLIST_SHARED', {
            username: user.name,
            playlist,
        });
    });


    socket.on('C2S_EMOTE', (emoji) => {
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (!roomId || !userId || !emoji) return;

        // Broadcast instantly, no DB storage needed for floating reactions
        io.to(roomId).emit('S2C_EMOTE', {
            userId,
            emoji
        });
    });

    socket.on('C2S_UPDATE_QUEUE', (queue) => {
        const roomId = socket.data.activeRoomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (room) {
            room.activeQueue = queue;
            io.to(roomId).emit('S2C_QUEUE_UPDATE', queue);
            io.to(roomId).emit('S2C_ROOM_STATE', room);
        }
    });

    socket.on('C2S_LOCAL_FILE_SELECTED', (data) => {
        const roomId = socket.data.activeRoomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (room && room.currentMedia && room.currentMedia.source === 'LOCAL') {
            room.currentMedia.localFileName = data.fileName;
            room.currentMedia.localFileSize = data.fileSize;
        }

        io.to(roomId).emit('S2C_LOCAL_FILE_SELECTED', data);
        if (room) {
            io.to(roomId).emit('S2C_ROOM_STATE', room);
        }
    });

    socket.on('C2S_WEBRTC_OFFER', (data) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId) return;

        const room = roomManager.getRoom(roomId);
        if (room && room.users[data.targetUserId]) {
            socket.to(room.users[data.targetUserId].socketId).emit('S2C_WEBRTC_OFFER', {
                senderId,
                offer: data.offer
            });
        }
    });

    socket.on('C2S_WEBRTC_ANSWER', (data) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId) return;

        const room = roomManager.getRoom(roomId);
        if (room && room.users[data.targetUserId]) {
            socket.to(room.users[data.targetUserId].socketId).emit('S2C_WEBRTC_ANSWER', {
                senderId,
                answer: data.answer
            });
        }
    });

    socket.on('C2S_WEBRTC_ICE', (data) => {
        const roomId = socket.data.activeRoomId;
        const senderId = socket.data.user?.userId;
        if (!roomId || !senderId) return;

        const room = roomManager.getRoom(roomId);
        if (room && room.users[data.targetUserId]) {
            socket.to(room.users[data.targetUserId].socketId).emit('S2C_WEBRTC_ICE', {
                senderId,
                candidate: data.candidate
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const roomId = socket.data.activeRoomId;
        const userId = socket.data.user?.userId;
        if (userId && roomId) {
            const roomAlive = roomManager.removeUserFromRoom(roomId, userId);
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
