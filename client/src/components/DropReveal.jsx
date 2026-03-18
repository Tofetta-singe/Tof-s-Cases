import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ITEM_WIDTH = 132;
const BASIC_REVEAL_SOUND = "/sound_ui_item_drop_basic.wav";
const LEGENDARY_REVEAL_SOUND = "/sound_ui_item_reveal5_legendary.wav";
const SCROLL_SOUND = "/sound_ui_csgo_ui_crate_item_scroll.wav";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} \u20ac`;
}

function isHighValueRarity(rarityName = "") {
  return rarityName === "Covert" || rarityName === "Special Rare";
}

function playAudio(audioRef, src) {
  if (!audioRef.current) {
    audioRef.current = new Audio(src);
  }

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current.src = src;
  audioRef.current.play().catch(() => {});
}

export function DropReveal({ opening, onRevealEnd }) {
  const [phase, setPhase] = useState("idle");
  const scrollAudioRef = useRef(null);
  const revealAudioRef = useRef(null);

  const trackOffset = useMemo(() => {
    if (!opening?.reel) {
      return 0;
    }

    const winnerIndex = opening.reel.winnerIndex ?? 0;
    return -winnerIndex * (opening.reel.itemWidth || ITEM_WIDTH);
  }, [opening]);

  const suspenseWindow = useMemo(() => {
    if (!opening?.reel?.items?.length) {
      return [];
    }

    const winnerIndex = opening.reel.winnerIndex ?? 0;
    return opening.reel.items.slice(Math.max(0, winnerIndex - 3), winnerIndex + 1);
  }, [opening]);

  useEffect(() => {
    if (!opening?.reward) {
      return undefined;
    }

    setPhase("spinning");

    const scrollInterval = opening.reel
      ? window.setInterval(() => {
          playAudio(scrollAudioRef, SCROLL_SOUND);
        }, 108)
      : null;

    const settleTimeout = window.setTimeout(() => {
      if (scrollInterval) {
        window.clearInterval(scrollInterval);
      }
      setPhase("settled");
      playAudio(
        revealAudioRef,
        isHighValueRarity(opening.reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND
      );
      onRevealEnd?.();
    }, opening.reel?.durationMs || 300);

    return () => {
      if (scrollInterval) {
        window.clearInterval(scrollInterval);
      }
      window.clearTimeout(settleTimeout);
    };
  }, [opening, onRevealEnd]);

  return (
    <AnimatePresence>
      {opening?.reward ? (
        <motion.div
          key={opening.revealId || opening.reward.itemId}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-[32px] border border-amber-400/25 bg-gradient-to-br from-amber-400/12 via-black/20 to-sky-400/10 p-6 shadow-neon"
        >
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Case Reveal</p>
          {opening.reel ? (
            <div
              className={`mt-5 overflow-hidden rounded-[28px] border px-4 py-5 ${
                phase === "spinning" && suspenseWindow.some((item) => isHighValueRarity(item.rarity?.name))
                  ? "border-amber-300/50 bg-amber-300/8"
                  : "border-white/10 bg-black/30"
              }`}
            >
              <div className="relative">
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[3px] -translate-x-1/2 bg-amber-300 shadow-[0_0_24px_rgba(245,196,81,0.95)]" />
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: trackOffset }}
                  transition={{
                    duration: (opening.reel.durationMs || 5000) / 1000,
                    ease: [0.08, 0.72, 0.16, 1]
                  }}
                  className={`flex gap-3 ${
                    phase === "spinning" && suspenseWindow.some((item) => isHighValueRarity(item.rarity?.name))
                      ? "animate-[pulse_0.45s_ease-in-out_infinite]"
                      : ""
                  }`}
                >
                  {opening.reel.items.map((item, index) => {
                    const nearWinner =
                      Math.abs(index - (opening.reel.winnerIndex ?? 0)) <= 2 &&
                      isHighValueRarity(item.rarity?.name);

                    return (
                      <div
                        key={item.itemId}
                        className={`w-[120px] shrink-0 rounded-3xl border p-3 ${
                          nearWinner ? "border-amber-300/50 bg-amber-300/12" : "border-white/8 bg-white/[0.04]"
                        }`}
                      >
                        <img src={item.image} alt={item.name} className="mx-auto h-16 w-16 object-contain" />
                        <p className="mt-3 line-clamp-2 text-xs text-white">{item.name}</p>
                        <p className="mt-1 text-[11px]" style={{ color: item.rarity.color }}>
                          {item.rarity.name}
                        </p>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
            <img
              src={opening.reward.image}
              alt={opening.reward.name}
              className="h-32 w-32 rounded-3xl border border-white/8 bg-black/20 object-contain p-3"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white">{opening.reward.name}</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                <span>Float {opening.reward.float.toFixed(4)}</span>
                <span>{opening.reward.wear}</span>
                <span>Pattern #{opening.reward.patternSeed}</span>
                <span>{opening.reward.patternName}</span>
                <span style={{ color: opening.reward.rarity.color }}>{opening.reward.rarity.name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-white">{currency(opening.reward.price)}</p>
              <p className="text-sm text-slate-400">Revente {currency(opening.reward.sellPrice)}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
