const multer = require("multer");
const AWS = require("aws-sdk");

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MinIO Configuration (S3 Compatible)
const s3 = new AWS.S3({
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_KEY,
    secretAccessKey: process.env.S3_SECRET,
    region: "us-east-1",
    s3ForcePathStyle: true, // Needed for MinIO
    signatureVersion: "v4",
    sslEnabled: false // Disable SSL for local development
});

async function uploadFileToS3({
    name,
    file,
    folder,
    contentType
}) {
    const folderPath = folder || "";
    const fileKey = folderPath
        ? `${folderPath}/${Date.now()}-${name}`
        : `${Date.now()}-${name}`;

    try {
        const uploadResult = await s3
            .upload({
                Bucket: process.env.S3_BUCKET,
                Key: fileKey,
                Body: file,
                ContentType: contentType,
                ACL: "public-read", // Set permissions
            })
            .promise();

        // Construct the private URL using the internal Docker network URL
        const privateUrl = `${process.env.S3_PRIVATE_DOMAIN}/${encodeURIComponent(process.env.S3_BUCKET)}/${encodeURIComponent(uploadResult.Key)}`;
        
        // Construct the public URL using localhost
        const publicUrl = `${process.env.S3_PUBLIC_DOMAIN}/${encodeURIComponent(process.env.S3_BUCKET)}/${encodeURIComponent(uploadResult.Key)}`;
        
        return {
            publicUrl,
            privateUrl
        };
    } catch (error) {
        console.error("Upload Error:", error);
        return null;
    }
}

module.exports = {
    uploadFileToS3
};