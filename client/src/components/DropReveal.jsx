import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BASIC_REVEAL_SOUND = "/sound_ui_item_drop_basic.wav";
const LEGENDARY_REVEAL_SOUND = "/sound_ui_item_reveal5_legendary.wav";
const SCROLL_SOUND = "/sound_ui_csgo_ui_crate_item_scroll.wav";
const WINDOW_RADIUS = 3;

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

function getWindowItems(items = [], centerIndex = 0) {
  const output = [];

  for (let offset = -WINDOW_RADIUS; offset <= WINDOW_RADIUS; offset += 1) {
    output.push(items[centerIndex + offset] || null);
  }

  return output;
}

export function DropReveal({ opening, onRevealEnd }) {
  const [phase, setPhase] = useState("idle");
  const [cursorIndex, setCursorIndex] = useState(0);
  const scrollAudioRef = useRef(null);
  const revealAudioRef = useRef(null);

  const winnerIndex = opening?.reel?.winnerIndex ?? 0;
  const visibleItems = useMemo(
    () => getWindowItems(opening?.reel?.items, cursorIndex),
    [opening?.reel?.items, cursorIndex]
  );

  useEffect(() => {
    if (!opening?.reward) {
      return undefined;
    }

    if (!opening.reel?.items?.length) {
      setPhase("settled");
      const timeout = window.setTimeout(() => {
        playAudio(
          revealAudioRef,
          isHighValueRarity(opening.reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND
        );
        onRevealEnd?.();
      }, 250);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    setPhase("spinning");
    setCursorIndex(0);

    const steps = Math.max(winnerIndex, 1);
    const stepDelay = Math.max(70, Math.floor((opening.reel.durationMs || 5000) / steps));
    let currentIndex = 0;

    const interval = window.setInterval(() => {
      currentIndex += 1;
      setCursorIndex(Math.min(currentIndex, winnerIndex));
      playAudio(scrollAudioRef, SCROLL_SOUND);

      if (currentIndex >= winnerIndex) {
        window.clearInterval(interval);
        setPhase("settled");
        playAudio(
          revealAudioRef,
          isHighValueRarity(opening.reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND
        );
        onRevealEnd?.();
      }
    }, stepDelay);

    return () => {
      window.clearInterval(interval);
    };
  }, [opening, onRevealEnd, winnerIndex]);

  return (
    <AnimatePresence>
      {opening?.reward ? (
        <motion.div
          key={opening.revealId || opening.reward.itemId}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-[32px] border border-amber-400/25 bg-gradient-to-br from-amber-400/12 via-black/20 to-sky-400/10 p-6 shadow-neon"
        >
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Case Reveal</p>
          {opening.reel ? (
            <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30 px-4 py-5">
              <div className="relative grid grid-cols-7 gap-3">
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-[3px] -translate-x-1/2 bg-amber-300 shadow-[0_0_24px_rgba(245,196,81,0.95)]" />
                {visibleItems.map((item, index) => {
                  const isCenter = index === WINDOW_RADIUS;
                  const isDanger = item && isHighValueRarity(item.rarity?.name);

                  return (
                    <div
                      key={item?.itemId || `ghost-${index}`}
                      className={`min-h-[150px] rounded-3xl border p-3 transition-all duration-100 ${
                        isCenter
                          ? "scale-[1.03] border-amber-300/60 bg-white/[0.08]"
                          : "border-white/8 bg-white/[0.04]"
                      } ${
                        phase === "spinning" && isDanger && Math.abs(index - WINDOW_RADIUS) <= 1
                          ? "shadow-[0_0_28px_rgba(245,196,81,0.35)]"
                          : ""
                      }`}
                    >
                      {item ? (
                        <>
                          <img src={item.image} alt={item.name} className="mx-auto h-16 w-16 object-contain" />
                          <p className="mt-3 line-clamp-2 text-xs text-white">{item.name}</p>
                          <p className="mt-1 text-[11px]" style={{ color: item.rarity.color }}>
                            {item.rarity.name}
                          </p>
                        </>
                      ) : null}
                    </div>
                  );
                })}
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
