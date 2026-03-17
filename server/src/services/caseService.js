import { createId, randomFloat, randomItem, weightedRandom } from "../utils/random.js";
import { getWearTier } from "../utils/wear.js";
import { applyFloatPrice, getSellPrice } from "./pricingService.js";
import { getCaseById, getRarityWeight, getSkinsByRarity } from "./skinService.js";

function buildDrop(skin, caseId) {
  const floatValue = randomFloat(skin.min_float ?? 0, skin.max_float ?? 1);
  const realPrice = applyFloatPrice(skin.basePrice, floatValue);

  return {
    itemId: createId("itm"),
    skinId: skin.id,
    crateId: caseId,
    name: skin.name,
    image: skin.image,
    rarity: skin.rarity,
    float: floatValue,
    wear: getWearTier(floatValue),
    price: realPrice,
    sellPrice: getSellPrice(realPrice)
  };
}

export function openConfiguredCase(caseId) {
  if (caseId === "free-daily-case") {
    const freePool = getSkinsByRarity("Mil-Spec");
    return buildDrop(randomItem(freePool), caseId);
  }

  const caseData = getCaseById(caseId);
  if (!caseData) {
    throw new Error("Case not found");
  }

  const byRarity = new Map();
  for (const skin of caseData.skins) {
    const rarityName = skin.rarity?.name || "Mil-Spec";
    if (!byRarity.has(rarityName)) {
      byRarity.set(rarityName, []);
    }
    byRarity.get(rarityName).push(skin);
  }

  const weightedRarities = [...byRarity.entries()].map(([rarityName, skins]) => ({
    rarityName,
    skins,
    weight: getRarityWeight(rarityName)
  }));

  const selectedBucket = weightedRandom(weightedRarities);
  return buildDrop(randomItem(selectedBucket.skins), caseId);
}
