import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

const CreatePlaylistSchema = z.object({
    name: z.string().min(1).max(100),
});

const AddTrackSchema = z.object({
    title: z.string().min(1).max(200),
    mediaId: z.string().min(1),
    source: z.enum(['YOUTUBE', 'SOUNDCLOUD']),
    duration: z.number().int().positive().optional(),
    position: z.number().int().min(0).optional(),
});

// GET /api/playlists — fetch current user's playlists
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.isGuest) {
            return res.status(403).json({ error: 'Guest users cannot access playlists. Please create an account.' });
        }

        const playlists = await prisma.playlist.findMany({
            where: { ownerId: userId },
            include: {
                tracks: { orderBy: { position: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json({ playlists });
    } catch (error) {
        console.error('Get playlists error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/playlists — create a new playlist
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.isGuest) {
            return res.status(403).json({ error: 'Guest users cannot create playlists. Please create an account.' });
        }

        const parsed = CreatePlaylistSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const playlist = await prisma.playlist.create({
            data: {
                name: parsed.data.name,
                ownerId: userId,
            },
            include: { tracks: true },
        });

        return res.status(201).json({ playlist });
    } catch (error) {
        console.error('Create playlist error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/playlists/:id — delete a playlist (owner only)
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const playlist = await prisma.playlist.findUnique({ where: { id } });
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (playlist.ownerId !== userId) return res.status(403).json({ error: 'You can only delete your own playlists' });

        await prisma.playlist.delete({ where: { id } });
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete playlist error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/playlists/:id/tracks — add a track to a playlist
router.post('/:id/tracks', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const playlist = await prisma.playlist.findUnique({ where: { id }, include: { tracks: true } });
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (playlist.ownerId !== userId) return res.status(403).json({ error: 'You can only edit your own playlists' });

        const parsed = AddTrackSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });

        const position = parsed.data.position ?? playlist.tracks.length;

        const track = await prisma.track.create({
            data: {
                playlistId: id,
                title: parsed.data.title,
                mediaId: parsed.data.mediaId,
                source: parsed.data.source,
                duration: parsed.data.duration ?? null,
                position,
            },
        });

        return res.status(201).json({ track });
    } catch (error) {
        console.error('Add track error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/playlists/:id/tracks/:trackId — remove a track
router.delete('/:id/tracks/:trackId', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id, trackId } = req.params;

        const playlist = await prisma.playlist.findUnique({ where: { id } });
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (playlist.ownerId !== userId) return res.status(403).json({ error: 'You can only edit your own playlists' });

        await prisma.track.delete({ where: { id: trackId } });
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete track error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
