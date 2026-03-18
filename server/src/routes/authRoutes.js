import { Router } from "express";
import { env } from "../config/env.js";
import {
  clearSessionToken,
  exchangeDiscordCode,
  getDiscordAuthUrl,
  resolveUserFromToken
} from "../services/authService.js";

export const authRouter = Router();

authRouter.get("/discord", (_req, res) => {
  if (!env.discordClientId) {
    return res.status(400).json({
      error: "Discord OAuth is not configured"
    });
  }

  return res.json({ url: getDiscordAuthUrl() });
});

async function handleDiscordCallback(req, res, next) {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: "Missing code" });
    }

    const { token } = await exchangeDiscordCode(code);
    return res.redirect(`${env.clientUrl}?token=${token}`);
  } catch (error) {
    return next(error);
  }
}

authRouter.get("/discord/callback", handleDiscordCallback);
authRouter.get("/callback", handleDiscordCallback);

authRouter.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  return res.json({ user });
});

authRouter.post("/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  clearSessionToken(token);
  return res.json({ ok: true });
});
