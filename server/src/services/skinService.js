import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { estimateBasePrice } from "./pricingService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skinsPath = path.resolve(__dirname, "..", "..", "..", "skins.json");

const skins = JSON.parse(fs.readFileSync(skinsPath, "utf8"));

const rarityWeights = {
  Consumer: 35,
  Industrial: 25,
  "Mil-Spec": 19,
  Restricted: 11,
  Classified: 6,
  Covert: 3,
  Contraband: 0.8,
  Extraordinary: 0.2
};

const rarityUpgradePath = [
  "Consumer",
  "Industrial",
  "Mil-Spec",
  "Restricted",
  "Classified",
  "Covert",
  "Contraband",
  "Extraordinary"
];

const crateMap = new Map();

for (const skin of skins) {
  for (const crate of skin.crates || []) {
    if (!crateMap.has(crate.id)) {
      crateMap.set(crate.id, {
        id: crate.id,
        name: crate.name,
        image: crate.image,
        skins: []
      });
    }

    crateMap.get(crate.id).skins.push({
      ...skin,
      basePrice: estimateBasePrice(skin)
    });
  }
}

export function getAllSkins() {
  return skins;
}

export function getCases() {
  return [...crateMap.values()]
    .map((crate) => {
      const price = Number(
        (
          crate.skins.reduce((sum, skin) => sum + skin.basePrice, 0) /
          Math.max(crate.skins.length, 1) /
          2.2
        ).toFixed(2)
      );

      return {
        id: crate.id,
        name: crate.name,
        image: crate.image,
        price: Math.max(0.49, price),
        skinsCount: crate.skins.length
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function getCaseById(caseId) {
  return crateMap.get(caseId);
}

export function getDailyFreeCase() {
  const pool = skins.filter((skin) => skin.rarity?.name === "Mil-Spec");
  return {
    id: "free-daily-case",
    name: "Daily Free Case",
    image: pool[0]?.crates?.[0]?.image || "",
    price: 0,
    skinsCount: pool.length,
    daily: true
  };
}

export function getSkinsByRarity(rarityName) {
  return skins.filter((skin) => skin.rarity?.name === rarityName);
}

export function getUpgradeRarity(rarityName) {
  const currentIndex = rarityUpgradePath.indexOf(rarityName);
  if (currentIndex < 0 || currentIndex === rarityUpgradePath.length - 1) {
    return null;
  }

  return rarityUpgradePath[currentIndex + 1];
}

export function getRarityWeight(rarityName) {
  return rarityWeights[rarityName] || 1;
}
