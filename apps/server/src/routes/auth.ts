import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma';

const router = Router();

const GuestLoginSchema = z.object({
    name: z.string().min(2).max(50),
});

router.post('/guest', async (req: Request, res: Response) => {
    try {
        const parsed = GuestLoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const { name } = parsed.data;

        // Create a new user record for the guest
        const user = await prisma.user.create({
            data: {
                name,
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' } // Guests live for 7 days
        );

        return res.json({
            user: {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
            token,
        });
    } catch (error) {
        console.error('Guest login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2).max(50),
});

router.post('/register', async (req: Request, res: Response) => {
    try {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const { email, password, name } = parsed.data;

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                isGuest: false,
            },
        });

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        return res.json({
            user: { id: user.id, name: user.name, email: user.email, isGuest: user.isGuest, avatarUrl: user.avatarUrl },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const LoginSchema = z.object({
    identifier: z.string().min(1, 'Email or username is required'),
    password: z.string(),
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.issues });
        }

        const { identifier, password } = parsed.data;

        // Try to find user by email first, then by username (name)
        let user = await prisma.user.findUnique({ where: { email: identifier } });
        if (!user) {
            // Fall back to finding by name (case-insensitive)
            user = await prisma.user.findFirst({
                where: { name: { equals: identifier, mode: 'insensitive' }, isGuest: false }
            });
        }

        if (!user || user.isGuest || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        return res.json({
            user: { id: user.id, name: user.name, email: user.email, isGuest: user.isGuest, avatarUrl: user.avatarUrl },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
