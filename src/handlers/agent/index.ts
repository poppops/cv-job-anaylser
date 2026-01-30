import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { loadDocuments } from "../../utils/documents";
import { getState, saveState } from "../../state/store";
import { graph } from "../../graph/graph";

function getSessionId(req: Request): string {
    const fromBody = req.body?.sessionId;
    const fromHeader = req.headers["x-session-id"];
    const fromQuery = req.query?.sessionId;
    const id = (fromBody ?? fromHeader ?? fromQuery) as string | undefined;
    return typeof id === "string" && id.trim().length > 0 ? id.trim() : randomUUID();
}

export const chatWithGraph = async (req: Request, res: Response) => {
    const sessionId = getSessionId(req);
    const input = (req.body?.input ?? req.query?.input) as string | undefined;

    const files = req.files as { cv?: Express.Multer.File[]; jobs?: Express.Multer.File[] };
    const hasFiles = !!files?.cv?.[0] || (files?.jobs?.length ?? 0) > 0;
    const hasInput = typeof input === "string" && input.trim().length > 0;

    if (!hasFiles && !hasInput) {
        return res.status(400).json({
            sessionId,
            error: "Provide at least one of: CV file, job file(s), or text input (question).",
        });
    }

    let state = getState(sessionId);

    try {
        if (files?.cv?.[0]) {
            const cvDocs = await loadDocuments(files.cv[0]);
            const cvText = cvDocs[0]?.pageContent ?? "";
            const result = await graph.invoke({ ...state, type: "upload_cv", cvText });
            state = result as typeof state;

            if (state.cv && state.jobs?.length) {
                for (const job of state.jobs) {
                    const assessResult = await graph.invoke({
                        ...state,
                        type: "assess_job_fit",
                        pendingJob: job,
                    });
                    state = assessResult as typeof state;
                }
            }
        }

        if (files?.jobs?.length) {
            for (const jobFile of files.jobs) {
                const jobDocs = await loadDocuments(jobFile);
                const jobText = jobDocs[0]?.pageContent ?? "";
                const result = await graph.invoke({ ...state, type: "upload_job", jobText });
                state = result as typeof state;

                if (state.cv && state.jobs?.length) {
                    const newJob = state.jobs[state.jobs.length - 1];
                    if (newJob) {
                        const assessResult = await graph.invoke({
                            ...state,
                            type: "assess_job_fit",
                            pendingJob: newJob,
                        });
                        state = assessResult as typeof state;
                    }
                }
            }
        }

        if (input && typeof input === "string") {
            const result = await graph.invoke({ ...state, type: "question", question: input });
            state = result as typeof state;
        }

        saveState(sessionId, state);

        res.json({ sessionId, response: state.response });
    } catch (error) {
        console.error("Graph error:", error);
        res.status(500).json({
            sessionId,
            error: "Graph failed to process request",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    } finally {
        if (files?.cv?.[0]?.path) unlink(files.cv[0].path).catch(() => { });
        for (const f of files?.jobs ?? []) {
            if (f?.path) unlink(f.path).catch(() => { });
        }
    }
};
