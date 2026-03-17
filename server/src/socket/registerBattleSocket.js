import { createBattle, getBattle, joinBattle, startBattle } from "../services/battleService.js";
import { getOrCreateUser } from "../services/inventoryService.js";
import { pushFeedEvent } from "../services/feedService.js";

export function registerBattleSocket(io) {
  io.on("connection", (socket) => {
    socket.on("battle:create", async (payload, callback) => {
      try {
        const user = await getOrCreateUser({
          discordId: payload.userId,
          username: payload.username,
          avatar: payload.avatar
        });
        const battle = await createBattle({
          host: user,
          caseIds: payload.caseIds,
          maxPlayers: payload.maxPlayers
        });
        socket.join(battle.roomId);
        io.emit("battle:list-updated");
        callback?.({ battle });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    socket.on("battle:join", async ({ roomId, userId, username, avatar }, callback) => {
      try {
        const user = await getOrCreateUser({
          discordId: userId,
          username,
          avatar
        });
        const battle = await joinBattle(roomId, user);
        socket.join(roomId);
        io.to(roomId).emit("battle:state", battle);
        io.emit("battle:list-updated");
        callback?.({ battle });
      } catch (error) {
        callback?.({ error: error.message });
      }
    });

    socket.on("battle:subscribe", async ({ roomId }, callback) => {
      const battle = await getBattle(roomId);
      socket.join(roomId);
      callback?.({ battle });
    });

    socket.on("battle:start", async ({ roomId }, callback) => {
      try {
        const battle = await getBattle(roomId);
        if (!battle) {
          throw new Error("Battle not found");
        }

        io.to(roomId).emit("battle:state", { ...battle, status: "live" });
        const result = await startBattle(roomId);

        for (const round of result.rounds) {
          io.to(roomId).emit("battle:round", round);
        }

        io.to(roomId).emit("battle:finished", result);
        io.emit("battle:list-updated");

        if (result.winner.totalValue >= 150) {
          pushFeedEvent({
            type: "battle-win",
            username: result.winner.username,
            reward: {
              name: "Battle Winnings",
              price: result.winner.totalValue,
              rarity: { color: "#f5c451" }
            }
          });
        }

        callback?.(result);
      } catch (error) {
        callback?.({ error: error.message });
      }
    });
  });
}
