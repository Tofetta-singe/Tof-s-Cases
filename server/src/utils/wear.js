export function getWearTier(floatValue) {
  if (floatValue <= 0.07) {
    return "Factory New";
  }

  if (floatValue <= 0.15) {
    return "Minimal Wear";
  }

  if (floatValue <= 0.38) {
    return "Field-Tested";
  }

  if (floatValue <= 0.45) {
    return "Well-Worn";
  }

  return "Battle-Scarred";
}
