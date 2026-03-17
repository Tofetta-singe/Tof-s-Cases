import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "",
  discordClientId: process.env.DISCORD_CLIENT_ID || "",
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET || "",
  discordRedirectUri:
    process.env.DISCORD_REDIRECT_URI ||
    "http://localhost:4000/api/auth/discord/callback",
  jwtSecret: process.env.JWT_SECRET || "local-dev-secret"
};
