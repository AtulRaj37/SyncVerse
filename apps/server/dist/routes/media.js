"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
// Configure Multer for local storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generate a random hash to prevent naming collisions
        const randomString = crypto_1.default.randomBytes(8).toString('hex');
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${randomString}${ext}`);
    }
});
const upload = (0, multer_1.default)({
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
exports.default = router;
