export function randomFloat(min, max, precision = 4) {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(precision));
}

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function weightedRandom(items, weightKey = "weight") {
  const total = items.reduce((sum, item) => sum + item[weightKey], 0);
  let cursor = Math.random() * total;

  for (const item of items) {
    cursor -= item[weightKey];
    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

export function createId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
