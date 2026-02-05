import { upsertVector } from "../services/pinecone";
import { parseCV, parseJob } from "../utils/documents";
import { embedText } from "../utils/embeddings";
import { GraphState } from "./state";
import openai from "openai";

export const parseCVNode = async (state: GraphState) => {
    if (!state.cvText) return state;
    const cv = await parseCV(state.cvText);
    return { cv, jobFits: [] };
};

export const upsertCVNode = async (state: GraphState) => {
    if (!state.cv) return state;

    for (const section of ['name', 'summary', 'strengths']) {
        const embedding = await embedText(state.cv[section as keyof typeof state.cv] as string);

        if (!embedding) {
            continue;
        }

        await upsertVector(section, embedding, {
            doc_type: "cv",
            candidate_name: state.cv.name,
            section,
            source_id: state.cvFilename ?? state.cv.name,
            text: state.cv[section as keyof typeof state.cv] as string,
        });
    }

    for (const skill of state.cv.skills) {
        const embedding = await embedText(JSON.stringify(skill));

        if (!embedding) {
            continue;
        }

        await upsertVector(skill.name, embedding, {
            doc_type: "cv",
            candidate_name: state.cv.name,
            section: "skills - " + skill.name,
            source_id: state.cvFilename ?? state.cv.name,
        });

    }

    return state;
};

export const parseJobNode = async (state: GraphState) => {
    if (!state.jobText) return state;
    const job = await parseJob(state.jobText);
    return { jobs: [...(state.jobs ?? []), job] };
};

export const upsertJobNode = async (state: GraphState) => {
    if (!state.jobs) return state;

    for (const job of state.jobs) {
        for (const section of ['title', 'description', 'benefits', 'location', 'company']) {

            let embedding: any;
            switch (section) {
                case 'benefits':
                    embedding = await embedText(JSON.stringify(job[section]));
                    break;

                default:
                    embedding = await embedText(job[section as keyof typeof job] as string);
                    break;
            }

            if (!embedding) {
                continue;
            }

            await upsertVector(section, embedding, {
                doc_type: "job",
                section,
                source_id: job.title,
                job_id: job.title,
                text: job[section as keyof typeof job] as string,
            });
        }

        for (const requirement of job.requirements) {
            const embedding = await embedText(JSON.stringify(requirement));

            if (!embedding) {
                continue;
            }

            await upsertVector(requirement.name, embedding, {
                doc_type: "job",
                section: "requirements" + requirement.name,
                source_id: job.title,
                job_id: job.title,
                text: JSON.stringify(requirement),
            });
        }
    }
}

export const generateResponseNode = async (state: GraphState) => {
    const client = new openai({
        apiKey: process.env.OPENAI_API_KEY || ""
    });

    const systemPrompt = `You assess how well a candidate fits specific job descriptions. 
    Use only the CV evidence and Job evidence provided below. 
    Do not use other knowledge or assume facts not in the evidence. 
    If the evidence does not support an answer to (part of) the question, say so clearly and do not guess. 
    Where possible, base each claim on a specific part of the evidence.`

    const userPrompt = `User question: ${state.question}

    CV evidence (excerpts from the candidate's CV — use only these):
    ${JSON.stringify(state.cvEvidence)}

    Job evidence (excerpts from the job description(s) — use only these):
    ${JSON.stringify(state.jobEvidence)}

    Assess the candidate's suitability for the role(s) using only the evidence above. If evidence is missing for something, say so.`;

    const assessedJobFit = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userPrompt,
            }
        ],
    });

    return { response: assessedJobFit.choices[0]?.message.content };
};