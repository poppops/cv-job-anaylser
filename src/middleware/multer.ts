import multer from "multer";
import path from "path";
import os from "os";

const tmpDir = process.env.VERCEL ? "/tmp" : os.tmpdir();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, tmpDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

export default upload;