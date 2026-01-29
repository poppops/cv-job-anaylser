import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import router from "./routes";
const app = express();

app.use(cors());
app.use(helmet());

if (process.env.NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

app.use("/api", router);

export default app;