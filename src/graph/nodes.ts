import { assessJobFit, parseCV, parseJob } from "../utils/documents";
import { GraphState } from "./state";
import openai from "openai";

export const parseCVNode = async (state: GraphState) => {
    if (!state.cvText) return state;
    const cv = await parseCV(state.cvText);
    return { cv, jobFits: [] };
};

export const parseJobNode = async (state: GraphState) => {
    if (!state.jobText) return state;
    const job = await parseJob(state.jobText);
    return { jobs: [...(state.jobs ?? []), job] };
};

export const assessJobFitNode = async (state: GraphState) => {
    if (!state.cv || !state.pendingJob) return state;
    const fit = await assessJobFit(state.cv, state.pendingJob);
    return { jobFits: [...(state.jobFits ?? []), fit] };
};

export const generateResponseNode = async (state: GraphState) => {
    const client = new openai({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    const assessedJobFit = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that assesses the fit between a CV and a job description",
            },
            {
                role: "user",
                content: `Answer the query: "${state.question}" based on the following CV and job descriptions:\n\nCV:\n\n${JSON.stringify(state.cv)}\n\nJob Description:\n\n${JSON.stringify(state.jobs)}`,
            }
        ],
    });

    return { response: assessedJobFit.choices[0]?.message.content };

};