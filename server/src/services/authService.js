import { env } from "../config/env.js";
import { memoryStore } from "../data/memoryStore.js";
import { createSessionToken, getOrCreateUser, getUserById } from "./inventoryService.js";

export function getDiscordAuthUrl() {
  const params = new URLSearchParams({
    client_id: env.discordClientId,
    response_type: "code",
    redirect_uri: env.discordRedirectUri,
    scope: "identify guilds"
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code) {
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.discordClientId,
      client_secret: env.discordClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: env.discordRedirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error("Discord token exchange failed");
  }

  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `${tokenData.token_type} ${tokenData.access_token}`
    }
  });

  if (!profileResponse.ok) {
    throw new Error("Discord profile fetch failed");
  }

  const profile = await profileResponse.json();
  const user = await getOrCreateUser({
    discordId: profile.id,
    username: profile.username,
    avatar: profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : `https://api.dicebear.com/9.x/thumbs/svg?seed=${profile.username}`
  });

  const token = createSessionToken();
  memoryStore.sessionTokens.set(token, user.id);
  return { user, token };
}

export async function resolveUserFromToken(token) {
  const userId = memoryStore.sessionTokens.get(token);
  if (!userId) {
    return null;
  }
  return getUserById(userId);
}

export function clearSessionToken(token) {
  if (!token) {
    return false;
  }

  return memoryStore.sessionTokens.delete(token);
}
