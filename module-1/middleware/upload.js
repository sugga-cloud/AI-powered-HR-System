import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        
        // Determine upload path based on file type
        if (file.fieldname === 'video') {
            uploadPath = path.join(__dirname, '..', 'uploads', 'interviews');
        } else if (file.fieldname === 'code') {
            uploadPath = path.join(__dirname, '..', 'uploads', 'code-submissions');
        } else {
            uploadPath = path.join(__dirname, '..', 'uploads', 'misc');
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'video') {
        // Accept video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    } else if (file.fieldname === 'code') {
        // Accept code files
        const allowedExtensions = ['.js', '.py', '.java', '.cpp', '.c', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type for code submission!'), false);
        }
    } else {
        // Default accept
        cb(null, true);
    }
};

// Create multer instance
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 5 // Max 5 files per request
    }
});

// Export middleware functions for different upload scenarios
export const uploadVideo = upload.single('video');
export const uploadCode = upload.single('code');
export const uploadMultiple = upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'code', maxCount: 1 }
]);

// Error handler middleware
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer error handling
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 50MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files uploaded'
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        // Other errors
        return res.status(500).json({
            message: err.message || 'Unknown error during file upload'
        });
    }
    next();
};