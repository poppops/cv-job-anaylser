import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphStateAnnotation } from "./state";
import { router } from "./router";
import { parseCVNode, parseJobNode, assessJobFitNode, generateResponseNode } from "./nodes";

export const graph = new StateGraph(GraphStateAnnotation)
    .addNode("router", (state) => state)
    .addNode("parse_cv", parseCVNode)
    .addNode("parse_job", parseJobNode)
    .addNode("assess_job_fit", assessJobFitNode)
    .addNode("generate_response", generateResponseNode)
    .addEdge(START, "router")
    .addConditionalEdges("router", router)
    .addEdge("parse_cv", END)
    .addEdge("parse_job", END)
    .addEdge("assess_job_fit", END)
    .addEdge("generate_response", END)
    .compile();