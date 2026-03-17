import crypto from "crypto";
import { UserModel } from "../models/User.js";
import { memoryStore } from "../data/memoryStore.js";
import { isDatabaseConnected } from "../config/db.js";

function toPublicUser(user) {
  const inventoryValue = (user.inventory || []).reduce(
    (sum, item) => sum + item.price,
    0
  );

  return {
    id: user.discordId,
    username: user.username,
    avatar: user.avatar,
    balance: user.balance,
    totalInventoryValue: Number(inventoryValue.toFixed(2)),
    inventory: user.inventory || [],
    lastFreeCaseAt: user.lastFreeCaseAt || null
  };
}

function buildSeededUser(discordId, username = "Guest Dropper") {
  return {
    discordId,
    username,
    avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${discordId}`,
    balance: 250,
    totalInventoryValue: 0,
    inventory: [],
    lastFreeCaseAt: null
  };
}

export async function getOrCreateUser({ discordId, username, avatar }) {
  if (isDatabaseConnected()) {
    let user = await UserModel.findOne({ discordId });
    if (!user) {
      user = await UserModel.create({
        discordId,
        username,
        avatar,
        balance: 250,
        inventory: []
      });
    }

    return toPublicUser(user.toObject());
  }

  if (!memoryStore.users.has(discordId)) {
    memoryStore.users.set(
      discordId,
      buildSeededUser(discordId, username || "Guest Dropper")
    );
  }

  const user = memoryStore.users.get(discordId);
  if (username) {
    user.username = username;
  }
  if (avatar) {
    user.avatar = avatar;
  }
  return toPublicUser(user);
}

export async function getUserById(discordId) {
  if (isDatabaseConnected()) {
    const user = await UserModel.findOne({ discordId });
    return user ? toPublicUser(user.toObject()) : null;
  }

  const user = memoryStore.users.get(discordId);
  return user ? toPublicUser(user) : null;
}

export async function saveUser(user) {
  const userId = user.id || user.discordId;

  if (isDatabaseConnected()) {
    await UserModel.updateOne(
      { discordId: userId },
      {
        discordId: userId,
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        inventory: user.inventory,
        lastFreeCaseAt: user.lastFreeCaseAt
      },
      { upsert: true }
    );

    return getUserById(userId);
  }

  memoryStore.users.set(userId, {
    discordId: userId,
    username: user.username,
    avatar: user.avatar,
    balance: user.balance,
    inventory: user.inventory,
    lastFreeCaseAt: user.lastFreeCaseAt
  });
  return getUserById(userId);
}

export async function addInventoryItems(discordId, items) {
  const user = await getUserById(discordId);
  if (!user) {
    return null;
  }

  user.inventory = [...user.inventory, ...items];
  return saveUser(user);
}

export async function removeInventoryItems(discordId, itemIds) {
  const user = await getUserById(discordId);
  if (!user) {
    return null;
  }

  user.inventory = user.inventory.filter((item) => !itemIds.includes(item.itemId));
  return saveUser(user);
}

export function createSessionToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function getLeaderboard() {
  if (isDatabaseConnected()) {
    const users = await UserModel.find({}).lean();
    return users
      .map(toPublicUser)
      .sort((a, b) => b.totalInventoryValue - a.totalInventoryValue)
      .slice(0, 10);
  }

  return [...memoryStore.users.values()]
    .map(toPublicUser)
    .sort((a, b) => b.totalInventoryValue - a.totalInventoryValue)
    .slice(0, 10);
}
