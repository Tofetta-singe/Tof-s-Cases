const rarityBasePrice = {
  Consumer: [0.08, 0.55],
  Industrial: [0.2, 1.3],
  "Mil-Spec": [0.45, 5],
  Restricted: [1.5, 16],
  Classified: [7, 55],
  Covert: [35, 280],
  Contraband: [90, 700],
  Extraordinary: [140, 1200]
};

const categoryMultiplier = {
  Gloves: 3.6,
  Knives: 4.2,
  Pistols: 0.9,
  SMGs: 1,
  Rifles: 1.45,
  Sniper: 1.9
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

export function estimateBasePrice(skin) {
  const rarityName = skin.rarity?.name || "Mil-Spec";
  const [min, max] = rarityBasePrice[rarityName] || rarityBasePrice["Mil-Spec"];
  const spreadSeed = (Number.parseInt(String(skin.paint_index || 11), 10) % 100) / 100;
  const base = min + (max - min) * spreadSeed;
  const multiplier = resolveCategoryMultiplier(
    skin.category?.name,
    skin.weapon?.name || skin.name
  );
  return Number((base * multiplier).toFixed(2));
}

export function applyFloatPrice(basePrice, floatValue) {
  const wearMultiplier = Math.max(0.72, 1.14 - floatValue * 0.48);
  return Number((basePrice * wearMultiplier).toFixed(2));
}

export function getSellPrice(realPrice) {
  return Number((realPrice * 0.7).toFixed(2));
}
