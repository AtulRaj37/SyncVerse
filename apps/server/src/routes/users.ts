import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { prisma } from '../db/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Setup Multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../uploads/avatars'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
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
        // The file is saved in uploads/avatars, so URL is /uploads/avatars/filename
        const avatarUrl = `http://localhost:4000/uploads/avatars/${req.file.filename}`;

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
