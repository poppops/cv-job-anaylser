import { GraphState } from "../graph/state";

const sessions = new Map<string, GraphState>();

export function getState(sessionId: string): GraphState {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { jobs: [], jobFits: [], response: "" });
    }
    return sessions.get(sessionId)!;
}

export function saveState(sessionId: string, state: GraphState) {
    sessions.set(sessionId, state);
}