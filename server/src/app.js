import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/authRoutes.js";
import { gameRouter } from "./routes/gameRoutes.js";
import { battleRouter } from "./routes/battleRoutes.js";

export function createApp() {
  const app = express();

app.use(
    cors({
      origin: [
        "http://localhost:5173",                 // Ton PC (Vite)
        "https://tof-s-cases-client.vercel.app", // Ton URL Vercel exacte
        env.clientUrl                            // La variable que tu as mis dans ton .env
      ],
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/auth", authRouter);
  app.use("/api", gameRouter);
  app.use("/api/battles", battleRouter);

  app.use((error, _req, res, _next) => {
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  });

  return app;
}
