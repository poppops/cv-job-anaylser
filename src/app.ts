import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import router from "./routes";
import { openApiSpec } from "./openapi";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

app.use("/api", router);
app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
    customSiteTitle: "CV Job Analyser API",
}));

const frontendDist = path.join(process.cwd(), "frontend", "dist");
app.use(express.static(frontendDist));
app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;