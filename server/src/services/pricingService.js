import { getOfficialCaseMarketPriceByName } from "../data/caseCatalog.js";

const rarityBasePrice = {
  Consumer: [0.03, 0.45],
  Industrial: [0.05, 0.45],
  "Mil-Spec": [0.08, 1.2],
  Restricted: [0.25, 4.5],
  Classified: [0.9, 12],
  Covert: [3.5, 45],
  "Special Rare": [140, 1800],
  Contraband: [180, 2200]
};

const categoryMultiplier = {
  Gloves: 1.8,
  Knives: 2.2,
  Pistols: 0.75,
  SMGs: 0.82,
  Rifles: 1.05,
  Sniper: 1.3
};

function resolveCategoryMultiplier(categoryName = "", weaponName = "") {
  if (/glove/i.test(categoryName) || /wrap/i.test(weaponName)) {
    return categoryMultiplier.Gloves;
  }

  if (/knife|daggers|bayonet|karambit|talon|ursus|navaja/i.test(weaponName)) {
    return categoryMultiplier.Knives;
  }

  if (/awp|ssg|scar|g3sg1/i.test(weaponName)) {
    return categoryMultiplier.Sniper;
  }

  if (/ak-47|m4|famas|galil|aug|sg 553/i.test(weaponName)) {
    return categoryMultiplier.Rifles;
  }

  if (/glock|deagle|usp|p2000|p250|cz75|five-seven|tec-9|dual/i.test(weaponName)) {
    return categoryMultiplier.Pistols;
  }

  return categoryMultiplier.SMGs;
}

function getCaseMultiplier(caseName = "") {
  const casePrice = getOfficialCaseMarketPriceByName(caseName);
  if (!casePrice) {
    return 1;
  }

  return Math.max(0.72, Math.min(2.1, Math.pow(casePrice / 0.65, 0.28)));
}

function getFinishMultiplier(skin) {
  const source = `${skin.name || ""} ${skin.pattern?.name || ""}`;

  if (/fade|doppler|gamma doppler|marble fade|slaughter|case hardened|crimson web/i.test(source)) {
    return 1.75;
  }

  if (/printstream|vulcan|neo-noir|asiimov|hyper beast|temukau|kill confirmed/i.test(source)) {
    return 1.35;
  }

  return 1;
}

export function estimateBasePrice(skin, caseName = "") {
  const rarityName = skin.rarity?.name || "Mil-Spec";
  const [min, max] = rarityBasePrice[rarityName] || rarityBasePrice["Mil-Spec"];
  const spreadSeed = (Number.parseInt(String(skin.paint_index || 11), 10) % 100) / 100;
  const base = min + (max - min) * spreadSeed;
  const multiplier = resolveCategoryMultiplier(
    skin.category?.name,
    skin.weapon?.name || skin.name
  );
  const caseMultiplier = getCaseMultiplier(caseName);
  const finishMultiplier = getFinishMultiplier(skin);
  const souvenirMultiplier = skin.souvenir ? 1.12 : 1;

  return Number((base * multiplier * caseMultiplier * finishMultiplier * souvenirMultiplier).toFixed(2));
}

export function applyFloatPrice(basePrice, floatValue) {
  const wearMultiplier = Math.max(0.7, 1.12 - floatValue * 0.4);
  return Number((basePrice * wearMultiplier).toFixed(2));
}

export function getSellPrice(realPrice) {
  const margin = realPrice < 1 ? 0.7 : realPrice < 10 ? 0.76 : 0.82;
  return Number((realPrice * margin).toFixed(2));
}
