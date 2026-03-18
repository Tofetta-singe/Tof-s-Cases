import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", "..", ".env");

dotenv.config({ path: envPath });

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

const defaults = {
  PORT: "4000",
  SERVER_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4000",
  CLIENT_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173",
  DISCORD_CLIENT_ID: "",
  DISCORD_CLIENT_SECRET: "",
  JWT_SECRET: "change-me-in-vercel-env"
};

const serverUrl = normalizeBaseUrl(process.env.SERVER_URL || defaults.SERVER_URL);
const clientUrl = normalizeBaseUrl(process.env.CLIENT_URL || defaults.CLIENT_URL);

export const env = {
  port: Number(process.env.PORT || defaults.PORT),
  serverUrl,
  clientUrl,
  discordClientId: process.env.DISCORD_CLIENT_ID || defaults.DISCORD_CLIENT_ID,
  discordClientSecret:
    process.env.DISCORD_CLIENT_SECRET || defaults.DISCORD_CLIENT_SECRET,
  discordRedirectUri:
    normalizeBaseUrl(process.env.DISCORD_REDIRECT_URI) ||
    `${serverUrl}/api/auth/discord/callback`,
  jwtSecret: process.env.JWT_SECRET || defaults.JWT_SECRET
};
