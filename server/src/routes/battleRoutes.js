import { Router } from "express";
import { createBattle, getBattle, joinBattle, startBattle } from "../services/battleService.js";
import { resolveUserFromToken } from "../services/authService.js";
import { pushFeedEvent } from "../services/feedService.js";
import { getOrCreateUser } from "../services/inventoryService.js";

export const battleRouter = Router();

async function resolveRequestUser(req) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    const authenticatedUser = await resolveUserFromToken(token);
    if (authenticatedUser) {
      return authenticatedUser;
    }
  }

  const userId = req.headers["x-demo-user"] || "demo-user";
  return getOrCreateUser({
    discordId: String(userId),
    username: userId === "demo-user" ? "Tof" : String(userId),
    avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${userId}`
  });
}

battleRouter.post("/", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const { caseIds, maxPlayers } = req.body;
    const battle = await createBattle({
      host: user,
      caseIds,
      maxPlayers: maxPlayers || 4
    });
    return res.json({ battle });
  } catch (error) {
    return next(error);
  }
});

battleRouter.post("/:roomId/join", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const battle = await joinBattle(req.params.roomId, user);
    return res.json({ battle });
  } catch (error) {
    return next(error);
  }
});

battleRouter.post("/:roomId/start", async (req, res, next) => {
  try {
    const result = await startBattle(req.params.roomId);

    if (result.winner.totalValue >= 150) {
      pushFeedEvent({
        type: "battle-win",
        username: result.winner.username,
        reward: {
          name: "Battle Winnings",
          price: result.winner.totalValue,
          rarity: { color: "#f5c451" }
        }
      });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

battleRouter.get("/:roomId", async (req, res, next) => {
  try {
    const battle = await getBattle(req.params.roomId);
    return res.json({ battle });
  } catch (error) {
    return next(error);
  }
});
