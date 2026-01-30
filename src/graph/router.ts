import { END } from "@langchain/langgraph";
import { GraphState } from "./state";

export function router(state: GraphState): string | typeof END {
    switch (state.type) {
        case "upload_cv":
            return "parse_cv";
        case "upload_job":
            return "parse_job";
        case "assess_job_fit":
            return "assess_job_fit";
        case "question":
            return "generate_response";
        default:
            return END;
    }
}