import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes";
import hostingRouter from "./routes/hosting";
import { apiLimiter, chatLimiter, authLimiter } from "./middlewares/rate-limit";

const app: Express = express();

app.set("trust proxy", 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET || "zorvix-secret-change-in-production"));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/chat", chatLimiter);
app.use("/api", apiLimiter);

app.use("/api", router);

app.use("/hosted", hostingRouter);
app.use("/api/hosting", hostingRouter);

if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(path.dirname(process.argv[1]), "public");
  app.use(express.static(staticPath));
  app.use((_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

export default app;
