import { randomItem } from "../utils/random.js";
import { createInventoryItemFromSkin } from "./caseService.js";
import { getSkinsByRarity, getUpgradeRarity } from "./skinService.js";

export function resolveTradeUp(items) {
  if (items.length !== 10) {
    throw new Error("Trade-up requires exactly 10 skins");
  }

  const rarity = items[0].rarity?.name;
  if (!items.every((item) => item.rarity?.name === rarity)) {
    throw new Error("All skins must have the same rarity");
  }

  const nextRarity = getUpgradeRarity(rarity);
  if (!nextRarity || nextRarity === "Special Rare") {
    throw new Error("Selected rarity cannot be upgraded");
  }

  const pool = getSkinsByRarity(nextRarity);
  const skin = randomItem(pool);
  return createInventoryItemFromSkin(skin, skin.crates?.[0]?.id || "trade-up");
}
