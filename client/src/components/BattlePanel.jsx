import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { socket } from "../lib/socket";

const GAP = 10;
const CARD_WIDTH = 84;

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function emitSocket(eventName, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (response = {}) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }

      resolve(response);
    });
  });
}

function BattleRollLane({ seat, drop, roundKey, totalValue, highlightWinner }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const timeoutRef = useRef(null);
  const [settled, setSettled] = useState(false);
  const items = drop?.reel?.items || [];
  const winnerIndex = drop?.reel?.winnerIndex ?? 0;
  const duration = drop?.reel?.durationMs ?? 5200;
  const trackWidth = items.length ? items.length * CARD_WIDTH + Math.max(items.length - 1, 0) * GAP : 0;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSettled(false);

    if (!drop || !viewportRef.current || !trackRef.current || !items.length) {
      return undefined;
    }

    const viewportWidth = viewportRef.current.clientWidth;
    const step = CARD_WIDTH + GAP;
    const winnerCenter = winnerIndex * step + CARD_WIDTH / 2;
    const targetX = viewportWidth / 2 - winnerCenter;
    const startIndex = Math.max(1, winnerIndex - 6);
    const startCenter = startIndex * step + CARD_WIDTH / 2;
    const startX = viewportWidth / 2 - startCenter;

    trackRef.current.style.transition = "none";
    trackRef.current.style.transform = `translate3d(${startX}px, 0, 0)`;
    void trackRef.current.offsetWidth;
    trackRef.current.style.transition = `transform ${duration}ms cubic-bezier(0.08, 0.9, 0.2, 1)`;
    trackRef.current.style.transform = `translate3d(${targetX}px, 0, 0)`;

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setSettled(true);
    }, duration);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [drop, duration, items.length, roundKey, winnerIndex]);

  return (
    <div
      className={`overflow-hidden rounded-[20px] border px-4 py-4 ${
        highlightWinner
          ? "border-[#f4d36c] bg-[linear-gradient(180deg,rgba(92,74,23,0.46)_0%,rgba(41,31,14,0.7)_100%)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(60,67,79,0.84)_0%,rgba(32,37,46,0.96)_100%)]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {seat ? (
            <img src={seat.avatar} alt={seat.username} className="h-10 w-10 rounded-full border border-white/15" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-white/20 bg-black/20 text-xs uppercase text-slate-400">
              Empty
            </div>
          )}
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-white">
              {seat?.username || "Open Seat"}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {seat ? currency(totalValue) : "Waiting for player"}
            </p>
          </div>
        </div>
        {drop?.reward ? (
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Pull</p>
            <p className="text-sm font-semibold text-white">{currency(drop.reward.price)}</p>
          </div>
        ) : null}
      </div>

      {seat ? (
        <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,20,26,0.85)_0%,rgba(7,10,14,0.95)_100%)] p-3">
          <div ref={viewportRef} className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-[linear-gradient(90deg,rgba(8,11,14,0.98)_0%,rgba(8,11,14,0)_100%)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-[linear-gradient(270deg,rgba(8,11,14,0.98)_0%,rgba(8,11,14,0)_100%)]" />
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-[3px] -translate-x-1/2 bg-[#ff7676] shadow-[0_0_18px_rgba(255,118,118,0.85)]" />

            {items.length ? (
              <div
                ref={trackRef}
                className="flex will-change-transform"
                style={{ width: `${trackWidth}px`, gap: `${GAP}px` }}
              >
                {items.map((item, index) => {
                  const isWinnerCard = index === winnerIndex;
                  return (
                    <div
                      key={item.itemId || `${item.name}-${index}`}
                      className={`relative h-[108px] shrink-0 overflow-hidden rounded-[12px] border bg-[linear-gradient(180deg,rgba(102,108,118,0.88)_0%,rgba(52,57,65,0.94)_100%)] ${
                        settled && isWinnerCard ? "border-[#f4d36c]" : "border-black/25"
                      }`}
                      style={{ width: `${CARD_WIDTH}px` }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="mx-auto mt-3 h-16 w-16 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]"
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 h-[4px]"
                        style={{ backgroundColor: item.rarity?.color || "#64748b" }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-[108px] items-center justify-center text-sm uppercase tracking-[0.24em] text-slate-500">
                Waiting
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-[138px] items-center justify-center rounded-[14px] border border-dashed border-white/10 bg-black/10 text-sm uppercase tracking-[0.26em] text-slate-500">
          Join to enter this battle
        </div>
      )}

      <div className="mt-3 min-h-[42px]">
        {drop?.reward ? (
          <p className="text-sm font-semibold text-white">
            {drop.reward.name}
            <span className="ml-2 text-slate-400">({drop.reward.wear})</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildDisplayBattle(battle, caseMap) {
  const caseQueue =
    battle.caseQueue ||
    (battle.caseIds || [])
      .map((caseId) => caseMap.get(caseId))
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price
      }));

  return {
    ...battle,
    caseQueue
  };
}

export function BattlePanel({ battles = [], cases = [], currentUser, onBattleRefresh }) {
  const [selectedCases, setSelectedCases] = useState([]);
  const [activeBattle, setActiveBattle] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [winner, setWinner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const caseMap = useMemo(() => new Map(cases.map((item) => [item.id, item])), [cases]);
  const displayBattles = useMemo(
    () => battles.map((battle) => buildDisplayBattle(battle, caseMap)),
    [battles, caseMap]
  );
  const selectableCases = useMemo(() => cases.filter((item) => !item.daily).slice(0, 10), [cases]);

  useEffect(() => {
    if (!activeBattle?.roomId && displayBattles.length) {
      setActiveBattle(displayBattles[0]);
      return;
    }

    if (!activeBattle?.roomId) {
      return;
    }

    const updatedBattle = displayBattles.find((item) => item.roomId === activeBattle.roomId);
    if (updatedBattle) {
      setActiveBattle((current) => ({
        ...current,
        ...updatedBattle,
        rounds: current?.rounds?.length ? current.rounds : updatedBattle.rounds || []
      }));
    }
  }, [activeBattle?.roomId, displayBattles]);

  useEffect(() => {
    const refreshBattles = () => onBattleRefresh?.();
    socket.on("battle:list-updated", refreshBattles);
    return () => {
      socket.off("battle:list-updated", refreshBattles);
    };
  }, [onBattleRefresh]);

  useEffect(() => {
    if (!activeBattle?.roomId) {
      return undefined;
    }

    let unsubscribed = false;
    setError("");

    emitSocket("battle:subscribe", { roomId: activeBattle.roomId })
      .then(({ battle }) => {
        if (unsubscribed || !battle) {
          return;
        }

        const hydratedBattle = buildDisplayBattle(battle, caseMap);
        setActiveBattle(hydratedBattle);
        setRounds(hydratedBattle.rounds || []);
        setCurrentRound((hydratedBattle.rounds || []).at(-1) || null);

        if (hydratedBattle.status === "finished") {
          const hydratedWinner =
            hydratedBattle.players.find((player) => player.userId === hydratedBattle.winnerId) || null;
          setWinner(hydratedWinner);
        } else {
          setWinner(null);
        }
      })
      .catch((requestError) => {
        if (!unsubscribed) {
          setError(requestError.message);
        }
      });

    const handleState = (battle) => {
      if (battle.roomId !== activeBattle.roomId) {
        return;
      }

      const hydratedBattle = buildDisplayBattle(battle, caseMap);
      setActiveBattle((current) => ({
        ...current,
        ...hydratedBattle
      }));
    };

    const handleRound = (round) => {
      setCurrentRound(round);
      setRounds((current) => {
        const nextRounds = current.filter((entry) => entry.roundIndex !== round.roundIndex);
        return [...nextRounds, round].sort((a, b) => a.roundIndex - b.roundIndex);
      });
    };

    const handleFinished = (result) => {
      if (result.battle.roomId !== activeBattle.roomId) {
        return;
      }

      const hydratedBattle = buildDisplayBattle(result.battle, caseMap);
      setActiveBattle(hydratedBattle);
      setRounds(result.rounds || []);
      setCurrentRound((result.rounds || []).at(-1) || null);
      setWinner(result.winner || null);
      setBusy(false);
      onBattleRefresh?.();
    };

    socket.on("battle:state", handleState);
    socket.on("battle:round", handleRound);
    socket.on("battle:finished", handleFinished);

    return () => {
      unsubscribed = true;
      socket.off("battle:state", handleState);
      socket.off("battle:round", handleRound);
      socket.off("battle:finished", handleFinished);
    };
  }, [activeBattle?.roomId, caseMap, onBattleRefresh]);

  async function createRoom() {
    if (!selectedCases.length || !currentUser?.id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { battle } = await emitSocket("battle:create", {
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        caseIds: selectedCases,
        maxPlayers: 4
      });

      const hydratedBattle = buildDisplayBattle(battle, caseMap);
      setActiveBattle(hydratedBattle);
      setRounds([]);
      setCurrentRound(null);
      setWinner(null);
      onBattleRefresh?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(roomId) {
    if (!currentUser?.id) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { battle } = await emitSocket("battle:join", {
        roomId,
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar
      });

      setActiveBattle(buildDisplayBattle(battle, caseMap));
      setWinner(null);
      onBattleRefresh?.();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function startRoom() {
    if (!activeBattle?.roomId) {
      return;
    }

    setBusy(true);
    setError("");
    setRounds([]);
    setCurrentRound(null);
    setWinner(null);

    try {
      await emitSocket("battle:start", { roomId: activeBattle.roomId });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const hostBattleName = activeBattle?.players?.[0]?.username
    ? `${activeBattle.players[0].username}'s case battle`
    : "Select a battle";

  const playerSeats = Array.from({ length: activeBattle?.maxPlayers || 4 }, (_, index) => {
    return activeBattle?.players?.[index] || null;
  });

  const scoreByUserId = new Map((activeBattle?.players || []).map((player) => [player.userId, player.totalValue]));
  const currentRoundKey = `${activeBattle?.roomId || "battle"}-${currentRound?.roundIndex ?? "idle"}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="overflow-hidden rounded-[28px] border border-[#434a57] bg-[linear-gradient(180deg,rgba(86,95,109,0.9)_0%,rgba(32,37,46,0.96)_100%)] p-5 shadow-[0_26px_60px_rgba(0,0,0,0.3)]">
        <h2 className="text-center text-[30px] font-black uppercase tracking-[0.04em] text-white [text-shadow:0_2px_0_rgba(0,0,0,0.45)]">
          Case Battles
        </h2>

        <button
          type="button"
          onClick={createRoom}
          disabled={busy || !selectedCases.length}
          className="mt-4 w-full rounded-[14px] border border-[#ff8d9c] bg-[linear-gradient(180deg,rgba(76,83,95,0.92)_0%,rgba(45,49,58,0.96)_100%)] px-5 py-3 text-[20px] font-bold text-[#ff8d9c] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          Create Battle
        </button>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {selectableCases.map((item) => {
            const selected = selectedCases.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setSelectedCases((current) =>
                    selected ? current.filter((entry) => entry !== item.id) : [...current, item.id]
                  )
                }
                className={`flex items-center gap-3 rounded-[14px] border px-3 py-2 text-left transition ${
                  selected
                    ? "border-[#88f08a] bg-[rgba(67,116,53,0.32)]"
                    : "border-white/10 bg-[rgba(16,19,26,0.24)]"
                }`}
              >
                <img src={item.image} alt={item.name} className="h-12 w-12 object-contain" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{currency(item.price)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4 rounded-[14px] border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {displayBattles.length ? (
            displayBattles.map((battle) => {
              const hostName = battle.players?.[0]?.username || "Unknown";
              const totalCost = (battle.caseQueue || []).reduce((sum, item) => sum + Number(item.price || 0), 0);
              const isSelected = activeBattle?.roomId === battle.roomId;
              const userJoined = battle.players?.some((player) => player.userId === currentUser?.id);

              return (
                <div
                  key={battle.roomId}
                  onClick={() => setActiveBattle(battle)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveBattle(battle);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-[#8fb0ff] bg-[rgba(22,28,37,0.72)]"
                      : "border-white/10 bg-[rgba(13,17,23,0.45)] hover:bg-[rgba(22,28,37,0.65)]"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[18px] font-bold text-white">{hostName}&apos;s case battle</p>
                        <span className="shrink-0 text-[18px] font-semibold text-slate-200">
                          {battle.players.length}/{battle.maxPlayers}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(battle.caseQueue || []).map((item, index) => (
                          <div
                            key={`${battle.roomId}-${item.id}-${index}`}
                            className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/10 bg-[linear-gradient(180deg,rgba(70,74,84,0.96)_0%,rgba(36,39,47,0.98)_100%)] p-1"
                          >
                            <img src={item.image} alt={item.name} className="max-h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-[#6cff6f]">Total cost: {currency(totalCost)}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {battle.status === "waiting" ? "Waiting" : battle.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          joinRoom(battle.roomId);
                        }}
                        disabled={busy || battle.players.length >= battle.maxPlayers || userJoined}
                        className="rounded-[12px] border border-[#63d163] bg-[rgba(34,74,29,0.4)] px-6 py-2 text-[18px] font-bold text-[#72ff72] disabled:opacity-45"
                      >
                        {userJoined ? "Joined" : "Join"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[20px] border border-dashed border-white/15 bg-black/10 px-4 py-8 text-center text-sm uppercase tracking-[0.28em] text-slate-400">
              No battles yet. Pick some cases and open the arena.
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#434a57] bg-[linear-gradient(180deg,rgba(26,31,39,0.95)_0%,rgba(12,15,20,0.98)_100%)] p-5 shadow-[0_26px_60px_rgba(0,0,0,0.34)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-slate-400">Live Arena</p>
            <h3 className="mt-2 text-[28px] font-black text-white">{hostBattleName}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {currentRound?.caseName
                ? `Rolling ${currentRound.caseName}`
                : activeBattle?.caseQueue?.length
                  ? `${activeBattle.caseQueue.length} cases queued`
                  : "Choose or create a battle to start"}
            </p>
          </div>
          {activeBattle?.status === "waiting" && activeBattle?.players?.length >= 2 ? (
            <button
              type="button"
              onClick={startRoom}
              disabled={busy}
              className="rounded-[14px] border border-[#7cb3ff] bg-[rgba(40,66,108,0.46)] px-5 py-3 text-base font-bold uppercase tracking-[0.18em] text-[#cfe3ff] disabled:opacity-50"
            >
              Start Battle
            </button>
          ) : null}
        </div>

        {currentRound?.caseImage ? (
          <div className="mt-5 flex items-center gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <img src={currentRound.caseImage} alt={currentRound.caseName} className="h-16 w-16 object-contain" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current case</p>
              <p className="text-lg font-semibold text-white">{currentRound.caseName}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {playerSeats.map((seat, index) => {
            const drop = currentRound?.drops?.find((entry) => entry.userId === seat?.userId) || null;
            return (
              <BattleRollLane
                key={seat?.userId || `empty-seat-${index}`}
                seat={seat}
                drop={drop}
                roundKey={currentRoundKey}
                totalValue={seat?.userId ? scoreByUserId.get(seat.userId) || 0 : 0}
                highlightWinner={Boolean(winner?.userId && seat?.userId === winner.userId)}
              />
            );
          })}
        </div>

        {winner ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-[20px] border border-[#f4d36c] bg-[linear-gradient(180deg,rgba(95,74,24,0.32)_0%,rgba(43,31,9,0.6)_100%)] px-5 py-4"
          >
            <p className="text-xs uppercase tracking-[0.32em] text-[#f4d36c]">Winner</p>
            <p className="mt-2 text-2xl font-black text-white">
              {winner.username} takes the pot with {currency(winner.totalValue)}
            </p>
          </motion.div>
        ) : null}

        {rounds.length ? (
          <div className="mt-5 space-y-3">
            {rounds.map((round) => (
              <div
                key={`${round.caseId}-${round.roundIndex}`}
                className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={round.caseImage} alt={round.caseName} className="h-10 w-10 object-contain" />
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                      Round {round.roundIndex + 1}: {round.caseName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {round.drops.map((drop) => (
                      <span key={`${round.roundIndex}-${drop.userId}`} className="text-slate-300">
                        {drop.username}: <span className="text-white">{currency(drop.reward.price)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
