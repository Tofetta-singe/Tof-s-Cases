import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  FREE_DAILY_CASE_ID,
  FREE_DAILY_CASE_NAME,
  OFFICIAL_DROP_ODDS,
  getOfficialCaseMarketPriceByName,
  isOfficialCaseName
} from "../data/caseCatalog.js";
import { estimateBasePrice } from "./pricingService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skinsPath = path.resolve(__dirname, "..", "..", "..", "skins.json");

const skins = JSON.parse(fs.readFileSync(skinsPath, "utf8"));

const rarityUpgradePath = [
  "Consumer",
  "Industrial",
  "Mil-Spec",
  "Restricted",
  "Classified",
  "Covert",
  "Special Rare",
  "Contraband"
];

const crateMap = new Map();
const freeDailyPool = [];

function normalizeRarity(rarity = {}) {
  const name = rarity.name || "Mil-Spec";
  const cleaned = name.replace(/\s+Grade$/i, "");

  if (/extraordinary/i.test(cleaned)) {
    return {
      ...rarity,
      name: "Special Rare",
      color: "#e4ae39"
    };
  }

  return {
    ...rarity,
    name: cleaned
  };
}

function enrichSkin(skin, crateName = "") {
  const normalizedRarity = normalizeRarity(skin.rarity);

  return {
    ...skin,
    rarity: normalizedRarity,
    basePrice: estimateBasePrice(
      {
        ...skin,
        rarity: normalizedRarity
      },
      crateName
    )
  };
}

for (const skin of skins) {
  const normalizedRarity = normalizeRarity(skin.rarity);

  if (
    skin.souvenir &&
    ["Consumer", "Industrial", "Mil-Spec"].includes(normalizedRarity.name)
  ) {
    freeDailyPool.push(
      enrichSkin(
        {
          ...skin,
          rarity: normalizedRarity
        },
        FREE_DAILY_CASE_NAME
      )
    );
  }

  for (const crate of skin.crates || []) {
    if (!isOfficialCaseName(crate.name)) {
      continue;
    }

    if (!crateMap.has(crate.id)) {
      crateMap.set(crate.id, {
        id: crate.id,
        name: crate.name,
        image: crate.image,
        skins: []
      });
    }

    crateMap.get(crate.id).skins.push(
      enrichSkin(
        {
          ...skin,
          rarity: normalizedRarity
        },
        crate.name
      )
    );
  }
}

export function getAllSkins() {
  return skins;
}

export function getCases() {
  return [...crateMap.values()]
    .map((crate) => {
      return {
        id: crate.id,
        name: crate.name,
        image: crate.image,
        price: getOfficialCaseMarketPriceByName(crate.name),
        skinsCount: crate.skins.length
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function getCaseById(caseId) {
  return crateMap.get(caseId);
}

export function getDailyFreeCase() {
  return {
    id: FREE_DAILY_CASE_ID,
    name: FREE_DAILY_CASE_NAME,
    image: freeDailyPool[0]?.crates?.[0]?.image || "",
    price: 0,
    skinsCount: freeDailyPool.length,
    daily: true
  };
}

export function getSkinsByRarity(rarityName) {
  return skins
    .map((skin) => enrichSkin({ ...skin, rarity: normalizeRarity(skin.rarity) }, skin.crates?.[0]?.name))
    .filter((skin) => skin.rarity?.name === rarityName);
}

export function getUpgradeRarity(rarityName) {
  const currentIndex = rarityUpgradePath.indexOf(rarityName);
  if (currentIndex < 0 || currentIndex === rarityUpgradePath.length - 1) {
    return null;
  }

  return rarityUpgradePath[currentIndex + 1];
}

export function getRarityWeight(rarityName) {
  return OFFICIAL_DROP_ODDS[rarityName] || 0;
}

export function getFreeDailyPool() {
  return freeDailyPool;
}
