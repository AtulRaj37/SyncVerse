import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = Router();

// Configure Multer for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate a random hash to prevent naming collisions
        const randomString = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${randomString}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// POST /api/media/upload
router.post('/upload', upload.single('mediaFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the generated filename so the client can socket broadcast it
    res.json({
        filename: req.file.filename,
        url: `http://localhost:4000/uploads/${req.file.filename}`
    });
});

export default router;
