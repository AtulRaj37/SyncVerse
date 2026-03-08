"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../db/prisma");
const router = (0, express_1.Router)();
const GuestLoginSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
});
router.post('/guest', async (req, res) => {
    try {
        const parsed = GuestLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const { name } = parsed.data;
        // Create a new user record for the guest
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
            },
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' } // Guests live for 7 days
        );
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
            token,
        });
    }
    catch (error) {
        console.error('Guest login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2).max(50),
});
router.post('/register', async (req, res) => {
    try {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const { email, password, name } = parsed.data;
        // Check if user exists
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                isGuest: false,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.json({
            user: { id: user.id, name: user.name, email: user.email, isGuest: user.isGuest, avatarUrl: user.avatarUrl },
            token,
        });
    }
    catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
router.post('/login', async (req, res) => {
    try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.isGuest || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.json({
            user: { id: user.id, name: user.name, email: user.email, isGuest: user.isGuest, avatarUrl: user.avatarUrl },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
