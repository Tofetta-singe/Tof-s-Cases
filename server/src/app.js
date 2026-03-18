import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/authRoutes.js";
import { gameRouter } from "./routes/gameRoutes.js";
import { battleRouter } from "./routes/battleRoutes.js";

function buildCorsOptions() {
  const allowedOrigins = new Set(
    [env.clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean)
  );

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin) || /\.vercel\.app$/i.test(new URL(origin).hostname)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  };
}

export function createApiApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  app.use("/auth", authRouter);
  app.use("/", gameRouter);
  app.use("/battles", battleRouter);

  app.use((error, _req, res, _next) => {
    res.status(500).json({
      error: error.message || "Internal server error"
    });
  });

  return app;
}

export function createApp() {
  const app = express();
  app.use("/api", createApiApp());
  return app;
}
