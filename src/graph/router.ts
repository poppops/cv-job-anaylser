import { END } from "@langchain/langgraph";
import { GraphState } from "./state";

export function router(state: GraphState): string | typeof END {
    switch (state.type) {
        case "upload_cv":
            return "parse_cv";
        case "upsert_cv":
            return "upsert_cv";
        case "upload_job":
            return "parse_job";
        case "upsert_job":
            return "upsert_job";
        case "question":
            return "generate_response";
        default:
            return END;
    }
}