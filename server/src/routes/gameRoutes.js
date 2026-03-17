import { Router } from "express";
import { openConfiguredCase } from "../services/caseService.js";
import { resolveTradeUp } from "../services/contractService.js";
import { resolveUserFromToken } from "../services/authService.js";
import { getFeed, pushFeedEvent } from "../services/feedService.js";
import {
  addInventoryItems,
  getLeaderboard,
  getOrCreateUser,
  getUserById,
  removeInventoryItems,
  saveUser
} from "../services/inventoryService.js";
import { listBattles } from "../services/battleService.js";
import { getCases, getDailyFreeCase } from "../services/skinService.js";

export const gameRouter = Router();

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

gameRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

gameRouter.get("/dashboard", async (req, res) => {
  const user = await resolveRequestUser(req);
  const battles = await listBattles();
  res.json({
    user,
    cases: [...getCases().slice(0, 15), getDailyFreeCase()],
    feed: getFeed(),
    leaderboard: await getLeaderboard(),
    battles: battles.slice(0, 8)
  });
});

gameRouter.post("/cases/open", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const { caseId } = req.body;
    const reward = openConfiguredCase(caseId);

    if (caseId === "free-daily-case") {
      const lastDate = user.lastFreeCaseAt ? new Date(user.lastFreeCaseAt) : null;
      const now = new Date();
      if (
        lastDate &&
        lastDate.getUTCFullYear() === now.getUTCFullYear() &&
        lastDate.getUTCMonth() === now.getUTCMonth() &&
        lastDate.getUTCDate() === now.getUTCDate()
      ) {
        return res.status(400).json({ error: "Daily free case already claimed" });
      }

      user.lastFreeCaseAt = now.toISOString();
      await saveUser(user);
    }

    await addInventoryItems(user.id, [reward]);

    if (reward.price >= 120) {
      pushFeedEvent({
        type: "big-drop",
        username: user.username,
        reward
      });
    }

    return res.json({ reward });
  } catch (error) {
    return next(error);
  }
});

gameRouter.post("/contracts/trade-up", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const { itemIds } = req.body;
    const ownedUser = await getUserById(user.id);
    const selectedItems = ownedUser.inventory.filter((item) => itemIds.includes(item.itemId));

    const reward = resolveTradeUp(selectedItems);
    await removeInventoryItems(user.id, itemIds);
    await addInventoryItems(user.id, [reward]);

    return res.json({ reward });
  } catch (error) {
    return next(error);
  }
});
