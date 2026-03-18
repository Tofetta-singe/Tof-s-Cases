import { createId, randomFloat, randomItem, weightedRandom } from "../utils/random.js";
import { getWearTier } from "../utils/wear.js";
import { applyFloatPrice, getSellPrice } from "./pricingService.js";
import { getCaseById, getFreeDailyPool, getRarityWeight } from "./skinService.js";

function buildDrop(skin, caseId) {
  const floatValue = randomFloat(skin.min_float ?? 0, skin.max_float ?? 1);
  const realPrice = applyFloatPrice(skin.basePrice, floatValue);
  const patternSeed = Math.floor(Math.random() * 1000) + 1;

  return {
    itemId: createId("itm"),
    skinId: skin.id,
    crateId: caseId,
    name: skin.name,
    image: skin.image,
    rarity: skin.rarity,
    float: floatValue,
    wear: getWearTier(floatValue),
    patternName: skin.pattern?.name || "Default",
    patternSeed,
    price: realPrice,
    sellPrice: getSellPrice(realPrice)
  };
}

function pickFromCasePool(caseId) {
  if (caseId === "free-daily-case") {
    const freePool = getFreeDailyPool();
    return randomItem(freePool);
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

  const weightedRarities = [...byRarity.entries()]
    .map(([rarityName, skins]) => ({
      rarityName,
      skins,
      weight: getRarityWeight(rarityName)
    }))
    .filter((entry) => entry.weight > 0);

  const selectedBucket = weightedRandom(weightedRarities);
  return randomItem(selectedBucket.skins);
}

function buildReelEntry(skin, index) {
  return {
    itemId: `${skin.itemId || skin.skinId || skin.id}-${index}`,
    name: skin.name,
    image: skin.image,
    rarity: skin.rarity
  };
}

function buildOpeningReel(caseId, reward, length = 46) {
  const reel = [];
  const winnerIndex = length - 4;

  for (let index = 0; index < length; index += 1) {
    const skin = index === winnerIndex ? reward : buildDrop(pickFromCasePool(caseId), caseId);
    reel.push(buildReelEntry(skin, index));
  }

  const suspenseCandidates = [
    { offset: 1, rarity: "Covert", chance: 0.18 },
    { offset: 2, rarity: "Classified", chance: 0.26 },
    { offset: 3, rarity: "Restricted", chance: 0.34 }
  ];
  const caseData = caseId === "free-daily-case" ? null : getCaseById(caseId);

  for (const candidate of suspenseCandidates) {
    const targetIndex = winnerIndex - candidate.offset;
    if (targetIndex <= 0 || Math.random() > candidate.chance) {
      continue;
    }

    const suspensePool =
      caseId === "free-daily-case"
        ? getFreeDailyPool().filter((item) => item.rarity?.name === "Mil-Spec")
        : caseData?.skins.filter((item) => item.rarity?.name === candidate.rarity);

    if (!suspensePool?.length) {
      continue;
    }

    const skin = randomItem(suspensePool);
    reel[targetIndex] = buildReelEntry(skin, targetIndex);
  }

  return {
    durationMs: 5000,
    winnerIndex,
    itemWidth: 132,
    items: reel
  };
}

export function createInventoryItemFromSkin(skin, caseId) {
  return buildDrop(skin, caseId);
}

export function openConfiguredCase(caseId) {
  return buildDrop(pickFromCasePool(caseId), caseId);
}

export function previewConfiguredCase(caseId) {
  const reward = openConfiguredCase(caseId);

  return {
    reward,
    reel: buildOpeningReel(caseId, reward)
  };
}
