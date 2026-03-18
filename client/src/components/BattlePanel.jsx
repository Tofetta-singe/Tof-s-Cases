import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} \u20ac`;
}

export function BattlePanel({ battles = [], cases = [], currentUser, onBattleRefresh }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!activeBattle?.roomId || activeBattle.status === "finished") {
      return undefined;
    }

    const interval = window.setInterval(async () => {
      try {
        const { battle } = await api(`/battles/${activeBattle.roomId}`);
        setActiveBattle(battle);
      } catch {
        // Keep current UI state on temporary polling failure.
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeBattle?.roomId, activeBattle?.status]);

  const topCases = useMemo(() => cases.filter((item) => !item.daily).slice(0, 6), [cases]);

  async function createRoom() {
    if (!selectedCases.length) {
      return;
    }

    const { battle } = await api("/battles", {
      method: "POST",
      body: JSON.stringify({
        caseIds: selectedCases,
        maxPlayers: 2
      })
    });

    setActiveBattle(battle);
    setRounds([]);
    setWinner(null);
    onBattleRefresh?.();
  }

  async function joinRoom(roomId) {
    const { battle } = await api(`/battles/${roomId}/join`, { method: "POST" });
    setActiveBattle(battle);
    setRounds([]);
    setWinner(null);
    onBattleRefresh?.();
  }

  async function startRoom() {
    if (!activeBattle) {
      return;
    }

    const result = await api(`/battles/${activeBattle.roomId}/start`, { method: "POST" });
    setActiveBattle(result.battle);
    setRounds(result.rounds || []);
    setWinner(result.winner || null);
    onBattleRefresh?.();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[32px] border border-white/8 bg-panel/75 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Case Battles</p>
            <h3 className="mt-2 text-3xl font-semibold text-white">Winner takes all</h3>
          </div>
          <button
            onClick={createRoom}
            className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Create Room
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {topCases.map((item) => {
            const selected = selectedCases.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() =>
                  setSelectedCases((current) =>
                    selected ? current.filter((id) => id !== item.id) : [...current, item.id]
                  )
                }
                className={`rounded-3xl border p-4 text-left ${
                  selected ? "border-amber-300 bg-amber-300/10" : "border-white/8 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{item.name}</span>
                  <span className="text-sm text-slate-400">{currency(item.price)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          {battles.map((battle) => (
            <div
              key={battle.roomId}
              className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-white">{battle.roomId}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {battle.caseIds.length} cases • {battle.players.length}/{battle.maxPlayers} players
                </p>
              </div>
              <button
                onClick={() => joinRoom(battle.roomId)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
              >
                Join Room
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-white/8 bg-black/20 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Live Arena</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">
              {activeBattle ? activeBattle.roomId : "No active room"}
            </h3>
          </div>
          {activeBattle?.players?.length >= 2 && activeBattle?.status !== "finished" ? (
            <button
              onClick={startRoom}
              className="rounded-full bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Start Spin
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          {(activeBattle?.players || []).map((player) => (
            <div key={player.userId} className="rounded-3xl border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={player.avatar} alt={player.username} className="h-10 w-10 rounded-full" />
                  <div>
                    <p className="font-medium text-white">{player.username}</p>
                    <p className="text-xs text-slate-400">
                      {player.userId === currentUser?.id ? "You" : "Opponent"}
                    </p>
                  </div>
                </div>
                <span className="text-white">{currency(player.totalValue)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {rounds.map((round, index) => (
            <motion.div
              key={`${round.caseId}-${index}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{round.caseId}</p>
              <div className="mt-3 grid gap-3">
                {round.drops.map((drop) => (
                  <div key={drop.userId} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-300">{drop.username}</span>
                    <span className="text-sm text-white">{drop.reward.name} • {currency(drop.reward.price)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {winner ? (
          <div className="mt-6 rounded-3xl border border-amber-300/25 bg-amber-300/10 p-4">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Victory</p>
            <p className="mt-2 text-xl font-semibold text-white">{winner.username} won {currency(winner.totalValue)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
