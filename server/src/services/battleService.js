import { memoryStore } from "../data/memoryStore.js";
import { createId } from "../utils/random.js";
import { openConfiguredCase } from "./caseService.js";
import { addInventoryItems } from "./inventoryService.js";

export async function createBattle({ host, caseIds, maxPlayers = 2 }) {
  const battle = {
    roomId: createId("room"),
    status: "waiting",
    maxPlayers,
    caseIds,
    players: [
      {
        userId: host.id,
        username: host.username,
        avatar: host.avatar,
        totalValue: 0,
        drops: []
      }
    ],
    winnerId: null,
    winnerValue: 0
  };

  memoryStore.battles.set(battle.roomId, battle);

  return battle;
}

export async function listBattles() {
  return [...memoryStore.battles.values()].reverse();
}

export async function getBattle(roomId) {
  return memoryStore.battles.get(roomId) || null;
}

export async function joinBattle(roomId, user) {
  const battle = await getBattle(roomId);
  if (!battle) {
    throw new Error("Battle not found");
  }

  if (battle.players.some((player) => player.userId === user.id)) {
    return battle;
  }

  if (battle.status !== "waiting") {
    throw new Error("Battle already started");
  }

  if (battle.players.length >= battle.maxPlayers) {
    throw new Error("Battle room is full");
  }

  battle.players.push({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    totalValue: 0,
    drops: []
  });

  await persistBattle(battle);
  return battle;
}

export async function startBattle(roomId) {
  const battle = await getBattle(roomId);
  if (!battle) {
    throw new Error("Battle not found");
  }

  if (battle.players.length < 2) {
    throw new Error("At least two players are required");
  }

  battle.status = "live";
  const rounds = [];

  for (const caseId of battle.caseIds) {
    const round = {
      caseId,
      drops: []
    };

    for (const player of battle.players) {
      const reward = openConfiguredCase(caseId);
      player.drops.push(reward);
      player.totalValue = Number((player.totalValue + reward.price).toFixed(2));
      round.drops.push({
        userId: player.userId,
        username: player.username,
        reward
      });
    }

    rounds.push(round);
  }

  const winner = [...battle.players].sort((a, b) => b.totalValue - a.totalValue)[0];
  battle.status = "finished";
  battle.winnerId = winner.userId;
  battle.winnerValue = winner.totalValue;

  const winnings = battle.players.flatMap((player) => player.drops);
  await addInventoryItems(winner.userId, winnings);
  await persistBattle(battle);

  return {
    battle,
    rounds,
    winner
  };
}

async function persistBattle(battle) {
  memoryStore.battles.set(battle.roomId, battle);
}
