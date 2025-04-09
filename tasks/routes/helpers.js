const multer = require("multer");
const router = require("express").Router();
const cors = require("cors");
const { uploadFileToS3 } = require("../services/s3");

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// create an api to generate otp
router.options(
    "/generate",
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    })
);
// Upload Route
router.post(
    "/upload",
    upload.single("file"),
    cors({
        credentials: true,
        origin: process.env.CORS_DOMAINS.split(","),
    }),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        try {
            const result = await uploadFileToS3({
                name: req.file.originalname,
                file: req.file.buffer,
                contentType: req.file.mimetype,
                folder: req.body.folder || ""
            });

            if (!result) {
                return res.status(500).json({ message: "Upload failed" });
            }

            res.json({
                url: result.publicUrl,
                message: "Upload successful",
            });
        } catch (error) {
            console.error("Upload Error:", error);
            res.status(500).json({ message: "Upload failed", error: error.message });
        }
    }
);

module.exports = router;
