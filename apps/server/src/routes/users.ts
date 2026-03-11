import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { prisma } from '../db/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Setup Multer for avatar uploads (Using memory storage for Base64 since Render Free Tier wipes disk uploads)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const UpdateProfileSchema = z.object({
    name: z.string().min(2).max(50),
    bio: z.string().max(160).optional(),
});

// Get current user profile
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user });
    } catch (error) {
        console.error('Fetch profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Update profile text
router.put('/me', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const parsed = UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const userId = req.user!.userId;
        const { name, bio } = parsed.data;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { name, bio },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });

        return res.json({ user: updated });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload avatar
router.post('/me/avatar', verifyToken, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user!.userId;
        
        // Convert the image file buffer to a Base64 Data URI string so it permanently lives in the PostgreSQL DB
        const b64Buffer = req.file.buffer.toString('base64');
        const avatarUrl = `data:${req.file.mimetype};base64,${b64Buffer}`;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });

        return res.json({ user: updated });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
