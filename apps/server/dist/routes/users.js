"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../db/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Setup Multer for avatar uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../../uploads/avatars'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    bio: zod_1.z.string().max(160).optional(),
});
// Get current user profile
router.get('/me', auth_1.verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error('Fetch profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Update profile text
router.put('/me', auth_1.verifyToken, async (req, res) => {
    try {
        const parsed = UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const userId = req.user.userId;
        const { name, bio } = parsed.data;
        const updated = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { name, bio },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });
        return res.json({ user: updated });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// Upload avatar
router.post('/me/avatar', auth_1.verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const userId = req.user.userId;
        // The file is saved in uploads/avatars, so URL is /uploads/avatars/filename
        const avatarUrl = `http://localhost:4000/uploads/avatars/${req.file.filename}`;
        const updated = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: { id: true, name: true, email: true, bio: true, avatarUrl: true, isGuest: true, createdAt: true }
        });
        return res.json({ user: updated });
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
