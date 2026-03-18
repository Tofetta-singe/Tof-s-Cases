import { memoryStore } from "../data/memoryStore.js";
import { createId } from "../utils/random.js";
import { previewConfiguredCase } from "./caseService.js";
import { addInventoryItems } from "./inventoryService.js";
import { getCaseById, getDailyFreeCase } from "./skinService.js";

function getBattleCaseSnapshot(caseId) {
  if (caseId === "free-daily-case") {
    return getDailyFreeCase();
  }

  const caseData = getCaseById(caseId);
  if (!caseData) {
    throw new Error("Case not found");
  }

  return {
    id: caseData.id,
    name: caseData.name,
    image: caseData.image,
    price: caseData.price
  };
}

export async function createBattle({ host, caseIds, maxPlayers = 4 }) {
  const caseQueue = (caseIds || []).map(getBattleCaseSnapshot);
  const battle = {
    roomId: createId("room"),
    status: "waiting",
    maxPlayers,
    caseIds: caseQueue.map((item) => item.id),
    caseQueue,
    hostId: host.id,
    players: [
      {
        userId: host.id,
        username: host.username,
        avatar: host.avatar,
        totalValue: 0,
        drops: []
      }
    ],
    rounds: [],
    currentRoundIndex: -1,
    winnerId: null,
    winnerValue: 0,
    createdAt: Date.now()
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

  battle.players = battle.players.map((player) => ({
    ...player,
    totalValue: 0,
    drops: []
  }));
  battle.status = "live";
  const rounds = [];

  for (const [roundIndex, caseEntry] of battle.caseQueue.entries()) {
    const round = {
      roundIndex,
      caseId: caseEntry.id,
      caseName: caseEntry.name,
      caseImage: caseEntry.image,
      casePrice: caseEntry.price,
      revealDurationMs: 5200,
      drops: []
    };

    for (const player of battle.players) {
      const { reward, reel } = previewConfiguredCase(caseEntry.id);
      player.drops.push(reward);
      player.totalValue = Number((player.totalValue + reward.price).toFixed(2));
      round.drops.push({
        userId: player.userId,
        username: player.username,
        avatar: player.avatar,
        reward,
        reel: {
          ...reel,
          durationMs: round.revealDurationMs
        }
      });
    }

    rounds.push(round);
  }

  const winner = [...battle.players].sort((a, b) => b.totalValue - a.totalValue)[0];
  battle.rounds = rounds;
  battle.status = "finished";
  battle.currentRoundIndex = rounds.length - 1;
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
