import { Router } from "express";
import upload from "../middleware/multer";
import { processCVFile } from "../handlers/cv";

const router = Router();

router.get("/", (req, res) => {
    res.json({
        app: "CV Job Analyser",
        version: "1.0.0",
        description: "A simple API to analyse CVs and jobs",
        environment: process.env.NODE_ENV,
    });
});

router.post("/upload/cv", upload.single("cv"), processCVFile);

export default router;