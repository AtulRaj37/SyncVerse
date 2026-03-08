"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const nanoid_1 = require("nanoid");
const prisma_1 = require("../db/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const CreateRoomSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    isPrivate: zod_1.z.boolean().default(false).optional(),
});
// Create a new room
router.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        const parsed = CreateRoomSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const userId = req.user.userId;
        const { name, isPrivate } = parsed.data;
        const roomCode = (0, nanoid_1.nanoid)(6);
        const room = await prisma_1.prisma.room.create({
            data: {
                name,
                roomCode,
                hostId: userId,
                isPrivate: isPrivate || false,
            },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                }
            }
        });
        return res.status(201).json({ room });
    }
    catch (error) {
        console.error('Room creation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Get room details (used to check if room exists before joining via socket)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma_1.prisma.room.findUnique({
            where: { id },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    }
                }
            }
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        return res.json({ room });
    }
    catch (error) {
        console.error('Fetch room error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Get room details by Short Code (for invite links)
router.get('/by-code/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const room = await prisma_1.prisma.room.findUnique({
            where: { roomCode: code },
        });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        return res.json({ room });
    }
    catch (error) {
        console.error('Fetch room by code error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
