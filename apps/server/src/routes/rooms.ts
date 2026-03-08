import { Router, Response } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../db/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

const CreateRoomSchema = z.object({
    name: z.string().min(2).max(50),
    isPrivate: z.boolean().default(false).optional(),
});

// Create a new room
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const parsed = CreateRoomSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const userId = req.user!.userId;
        const { name, isPrivate } = parsed.data;
        const roomCode = nanoid(6);

        const room = await prisma.room.create({
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
    } catch (error) {
        console.error('Room creation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get room details (used to check if room exists before joining via socket)
router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const room = await prisma.room.findUnique({
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
    } catch (error) {
        console.error('Fetch room error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Get room details by Short Code (for invite links)
router.get('/by-code/:code', async (req: AuthRequest, res: Response) => {
    try {
        const { code } = req.params;

        const room = await prisma.room.findUnique({
            where: { roomCode: code },
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        return res.json({ room });
    } catch (error) {
        console.error('Fetch room by code error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
