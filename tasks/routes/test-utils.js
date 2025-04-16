const express = require('express');
const router = express.Router();
const multer = require('multer');
const cors = require('cors');
const { uploadFileToS3 } = require('../services/s3');
const { createGifFromMessageLogs } = require('../logic/logs');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Add CORS middleware
router.use(cors({
    origin: process.env.CORS_DOMAINS.split(','),
    credentials: true
}));

// File upload test endpoint
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await uploadFileToS3({
            name: req.file.originalname,
            file: req.file.buffer,
            contentType: req.file.mimetype,
            folder: 'test'
        });

        if (!result) {
            return res.status(500).json({ error: 'Upload failed' });
        }

        // Log the environment variables for debugging
        console.log('Environment variables:', {
            S3_ENDPOINT: process.env.S3_ENDPOINT,
            S3_BUCKET: process.env.S3_BUCKET,
            S3_PRIVATE_DOMAIN: process.env.S3_PRIVATE_DOMAIN,
            S3_PUBLIC_DOMAIN: process.env.S3_PUBLIC_DOMAIN
        });

        res.json({ 
            success: true, 
            publicUrl: result.publicUrl,
            privateUrl: result.privateUrl,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Test upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GIF creation test endpoint
router.get('/gif/:flowId/:runId', cors({
    credentials: true,
    origin: process.env.CORS_DOMAINS.split(','),
}), async (req, res) => {
    try {
        const { flowId, runId } = req.params;
        const result = await createGifFromMessageLogs({ flowId, runId });
        res.json(result);
    } catch (error) {
        console.error('Test GIF creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 