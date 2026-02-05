import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphStateAnnotation, type GraphState } from "./state";
import { router } from "./router";
import { parseCVNode, parseJobNode, generateResponseNode, upsertCVNode, upsertJobNode } from "./nodes";

export const graph = new StateGraph(GraphStateAnnotation)
    .addNode("router", (state: GraphState) => state)
    .addNode("parse_cv", parseCVNode)
    .addNode("upsert_cv", upsertCVNode)
    .addNode("parse_job", parseJobNode)
    .addNode("upsert_job", upsertJobNode)
    .addNode("generate_response", generateResponseNode)
    .addEdge(START, "router")
    .addConditionalEdges("router", router)
    .addEdge("parse_cv", "upsert_cv")
    .addEdge("upsert_cv", END)
    .addEdge("parse_job", "upsert_job")
    .addEdge("upsert_job", END)
    .addEdge("generate_response", END)
    .compile();