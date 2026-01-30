import { Router } from "express";
import upload from "../middleware/multer";
import { processCVFile, processJobSuitability } from "../handlers/cv";
import { processJobs } from "../handlers/jobs";
import { chatWithGraph } from "../handlers/agent";

const router = Router();

router.get("/", (req, res) => {
    res.json({
        app: "CV Job Analyser",
        version: "1.0.0",
        description: "A simple API to analyse CVs and jobs",
        environment: process.env.NODE_ENV,
    });
});

router.post("/import/cv", upload.single("cv"), processCVFile);
router.post("/import/jobs", upload.any(), processJobs);
router.post("/assess/job-fit", processJobSuitability);
router.post(
    "/chat",
    upload.fields([
        { name: "cv", maxCount: 1 },
        { name: "jobs", maxCount: 10 },
    ]),
    chatWithGraph
);

export default router;