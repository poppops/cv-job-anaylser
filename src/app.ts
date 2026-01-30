import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

app.use("/api", router);

const frontendDist = path.join(process.cwd(), "frontend", "dist");
app.use(express.static(frontendDist));
app.get(/(.*)/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;