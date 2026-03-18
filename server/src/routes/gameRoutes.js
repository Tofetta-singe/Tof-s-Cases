import { Router } from "express";
import { previewConfiguredCase } from "../services/caseService.js";
import { resolveTradeUp } from "../services/contractService.js";
import { resolveUserFromToken } from "../services/authService.js";
import { getFeed, pushFeedEvent } from "../services/feedService.js";
import {
  addInventoryItems,
  getLeaderboard,
  getOrCreateUser,
  getUserById,
  removeInventoryItems,
  updateUserBalance
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
    cases: [...getCases(), getDailyFreeCase()],
    feed: getFeed(),
    leaderboard: await getLeaderboard(),
    battles: battles.slice(0, 8)
  });
});

gameRouter.post("/cases/open", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const { caseId } = req.body;

    if (caseId !== "free-daily-case") {
      const availableCase = getCases().find((item) => item.id === caseId);
      if (!availableCase) {
        return res.status(404).json({ error: "Case not found" });
      }

      if ((user.balance || 0) < availableCase.price) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      await updateUserBalance(user.id, -availableCase.price);
    }

    const { reward, reel } = previewConfiguredCase(caseId);
    await addInventoryItems(user.id, [reward]);
    pushFeedEvent({
      type: reward.price >= 120 ? "big-drop" : "case-open",
      username: user.username,
      reward
    });

    return res.json({ reward, reel });
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

gameRouter.post("/inventory/sell", async (req, res, next) => {
  try {
    const user = await resolveRequestUser(req);
    const { itemId } = req.body;
    const ownedUser = await getUserById(user.id);
    const item = ownedUser.inventory.find((entry) => entry.itemId === itemId);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    await removeInventoryItems(user.id, [itemId]);
    const updatedUser = await updateUserBalance(user.id, item.sellPrice);

    return res.json({
      soldItemId: itemId,
      credited: item.sellPrice,
      balance: updatedUser.balance
    });
  } catch (error) {
    return next(error);
  }
});
