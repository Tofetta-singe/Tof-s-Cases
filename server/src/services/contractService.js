import { randomFloat, randomItem, createId } from "../utils/random.js";
import { getWearTier } from "../utils/wear.js";
import { applyFloatPrice, getSellPrice } from "./pricingService.js";
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
  if (!nextRarity) {
    throw new Error("Selected rarity cannot be upgraded");
  }

  const pool = getSkinsByRarity(nextRarity);
  const skin = randomItem(pool);
  const floatValue = randomFloat(skin.min_float ?? 0, skin.max_float ?? 1);
  const price = applyFloatPrice(skin.basePrice, floatValue);

  return {
    itemId: createId("itm"),
    skinId: skin.id,
    crateId: skin.crates?.[0]?.id || "trade-up",
    name: skin.name,
    image: skin.image,
    rarity: skin.rarity,
    float: floatValue,
    wear: getWearTier(floatValue),
    price,
    sellPrice: getSellPrice(price)
  };
}
