export const OFFICIAL_CASE_MARKET_PRICES = {
  "Clutch Case": 0.5,
  "Recoil Case": 0.55,
  "Revolution Case": 0.62,
  "Snakebite Case": 0.39,
  "Fracture Case": 0.47,
  "Prisma 2 Case": 0.74,
  "Prisma Case": 0.83,
  "Danger Zone Case": 1.18,
  "Revolver Case": 1.12,
  "Shadow Case": 1.04,
  "Falchion Case": 1.38,
  "Spectrum 2 Case": 1.71,
  "Spectrum Case": 3.95,
  "Chroma 2 Case": 3.48,
  "Chroma Case": 2.91,
  "Gamma 2 Case": 2.27,
  "Operation Phoenix Weapon Case": 2.16,
  "Operation Vanguard Weapon Case": 1.63,
  "Horizon Case": 1.24,
  "Dreams & Nightmares Case": 1.08,
  "Operation Wildfire Case": 3.34,
  "Shattered Web Case": 3.72,
  "Operation Broken Fang Case": 4.61,
  "Operation Riptide Case": 5.84,
  "Glove Case": 8.75,
  "eSports 2014 Summer Case": 8.1,
  "Operation Hydra Case": 18.4,
  "Huntsman Weapon Case": 7.25,
  "CS:GO Weapon Case": 96,
  "Operation Bravo Case": 40,
  "Kilowatt Case": 0.92,
  "Gallery Case": 0.94,
  "Fever Case": 0.99
};

export const OFFICIAL_DROP_ODDS = {
  "Mil-Spec": 79.92,
  Restricted: 15.98,
  Classified: 3.2,
  Covert: 0.64,
  "Special Rare": 0.26
};

export const FREE_DAILY_CASE_ID = "free-daily-case";
export const FREE_DAILY_CASE_NAME = "Daily Souvenir Package";

export function getOfficialCaseMarketPriceByName(caseName) {
  return OFFICIAL_CASE_MARKET_PRICES[caseName] ?? null;
}

export function isOfficialCaseName(caseName = "") {
  return Object.prototype.hasOwnProperty.call(OFFICIAL_CASE_MARKET_PRICES, caseName);
}
