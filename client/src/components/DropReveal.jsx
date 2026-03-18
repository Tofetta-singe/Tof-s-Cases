import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";

const BASIC_REVEAL_SOUND = "/sound_ui_item_drop_basic.wav";
const LEGENDARY_REVEAL_SOUND = "/sound_ui_item_reveal5_legendary.wav";
const SCROLL_SOUND = "/sound_ui_csgo_ui_crate_item_scroll.wav";
const GAP = 12;
const VISIBLE_CARDS = 6;

function currency(value) {
  return `${Number(value || 0).toFixed(2)}\u20ac`;
}

function playAudio(audioRef, src, volume) {
  if (!audioRef.current) {
    audioRef.current = new Audio(src);
  }

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current.src = src;
  audioRef.current.volume = volume;
  audioRef.current.play().catch(() => {});
}

function isLegendary(rarityName = "") {
  return rarityName === "Covert" || rarityName === "Special Rare";
}

function rarityShadow(rarityName = "") {
  if (rarityName === "Special Rare") {
    return "0 0 32px rgba(232, 198, 79, 0.45)";
  }

  if (rarityName === "Covert") {
    return "0 0 30px rgba(226, 83, 83, 0.35)";
  }

  if (rarityName === "Classified") {
    return "0 0 24px rgba(209, 91, 255, 0.25)";
  }

  return "none";
}

export function DropReveal({
  opening,
  busy,
  volume = 0.35,
  onRevealEnd,
  onSellReward,
  onReroll
}) {
  const [phase, setPhase] = useState("idle");
  const [cardWidth, setCardWidth] = useState(160);
  const viewportRef = useRef(null);
  const scrollAudioRef = useRef(null);
  const revealAudioRef = useRef(null);
  const tickIndexRef = useRef(0);
  const animationRef = useRef(null);
  const trackX = useMotionValue(0);

  const reward = opening?.reward || null;
  const items = opening?.reel?.items || [];
  const winnerIndex = opening?.reel?.winnerIndex ?? 0;
  const rewardRarityColor = reward?.rarity?.color || "#6b7280";

  const rewardTitleParts = useMemo(() => {
    if (!reward?.name) {
      return { weapon: "", skin: "" };
    }

    const [weapon, skin] = reward.name.split(" | ");
    return {
      weapon: weapon || reward.name,
      skin: skin || ""
    };
  }, [reward?.name]);

  useLayoutEffect(() => {
    if (!viewportRef.current) {
      return undefined;
    }

    const element = viewportRef.current;

    const updateSize = () => {
      const width = element.clientWidth;
      const nextCardWidth = Math.max(120, (width - GAP * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS);
      setCardWidth(nextCardWidth);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!reward || !items.length || !viewportRef.current) {
      return undefined;
    }

    animationRef.current?.stop?.();
    setPhase("spinning");

    const viewportWidth = viewportRef.current.clientWidth;
    const step = cardWidth + GAP;
    const winnerCenter = winnerIndex * step + cardWidth / 2;
    const targetX = viewportWidth / 2 - winnerCenter;
    const startIndex = Math.max(2, Math.min(5, items.length - VISIBLE_CARDS));
    const startCenter = startIndex * step + cardWidth / 2;
    const startX = viewportWidth / 2 - startCenter;

    tickIndexRef.current = startIndex;
    trackX.set(startX);

    const unsubscribe = trackX.on("change", (latest) => {
      const progress = (viewportWidth / 2 - latest - cardWidth / 2) / step;
      const nextTick = Math.floor(progress);

      if (nextTick > tickIndexRef.current && nextTick < winnerIndex) {
        tickIndexRef.current = nextTick;
        playAudio(scrollAudioRef, SCROLL_SOUND, volume);
      }
    });

    animationRef.current = animate(trackX, targetX, {
      duration: (opening.reel?.durationMs || 5000) / 1000,
      ease: [0.05, 0.9, 0.15, 1],
      onComplete: () => {
        setPhase("settled");
        playAudio(
          revealAudioRef,
          isLegendary(reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND,
          volume
        );
        onRevealEnd?.();
      }
    });

    return () => {
      unsubscribe();
      animationRef.current?.stop?.();
    };
  }, [reward, items, winnerIndex, opening?.reel?.durationMs, cardWidth, trackX, onRevealEnd, volume]);

  const trackWidth = items.length ? items.length * cardWidth + Math.max(items.length - 1, 0) * GAP : 0;

  return (
    <AnimatePresence>
      {reward ? (
        <motion.section
          key={opening?.revealId || reward.itemId}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="cs-panel rounded-[18px] px-5 py-5 md:px-6"
        >
          <div className="text-center">
            <h2 className="text-[28px] font-bold leading-tight text-white md:text-[34px]">
              {rewardTitleParts.weapon}
              {rewardTitleParts.skin ? (
                <>
                  {" | "}
                  <span style={{ color: rewardRarityColor }}>{rewardTitleParts.skin}</span>
                </>
              ) : null}
              <span className="text-slate-300"> ({reward.wear})</span>
            </h2>
          </div>

          <div className="mt-4 overflow-hidden rounded-[6px] border border-white/12 bg-[rgba(90,92,97,0.55)] p-3">
            <div ref={viewportRef} className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-[linear-gradient(90deg,rgba(58,61,67,0.92)_0%,rgba(58,61,67,0)_100%)]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-[linear-gradient(270deg,rgba(58,61,67,0.92)_0%,rgba(58,61,67,0)_100%)]" />
              <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[4px] -translate-x-1/2 bg-[#ead95f] shadow-[0_0_20px_rgba(234,217,95,0.85)]" />

              <motion.div
                className="flex will-change-transform"
                style={{
                  x: trackX,
                  width: trackWidth,
                  gap: `${GAP}px`
                }}
              >
                {items.map((item, index) => {
                  const nearWinner = phase === "spinning" && Math.abs(index - winnerIndex) <= 2;

                  return (
                    <div
                      key={item.itemId || `${item.name}-${index}`}
                      className="relative h-[200px] shrink-0 overflow-hidden rounded-[2px] border border-black/25 bg-[linear-gradient(180deg,rgba(124,122,124,0.72)_0%,rgba(98,100,106,0.8)_72%,rgba(74,78,84,0.97)_100%)]"
                      style={{
                        width: `${cardWidth}px`,
                        boxShadow: nearWinner ? rarityShadow(item.rarity?.name) : "none"
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className="mx-auto mt-5 h-32 w-32 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                      />
                      {nearWinner ? (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)]" />
                      ) : null}
                      <div
                        className="absolute bottom-0 left-0 h-[4px] w-full"
                        style={{ backgroundColor: item.rarity?.color || "#6b7280" }}
                      />
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSellReward?.(reward.itemId)}
              disabled={busy || phase !== "settled"}
              className="rounded-[10px] border border-[#4fb64d] bg-[linear-gradient(180deg,#20471e_0%,#183517_100%)] px-6 py-2 text-lg font-semibold text-[#88ff7b] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:opacity-50"
            >
              Sell for {currency(reward.sellPrice)}
            </button>
            <button
              type="button"
              onClick={() => onReroll?.(reward.crateId)}
              disabled={busy || phase !== "settled"}
              className="rounded-[10px] border border-[#3e8fd3] bg-[linear-gradient(180deg,#3d4c59_0%,#32404e_100%)] px-8 py-2 text-lg font-semibold text-[#d9e5ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] disabled:opacity-50"
            >
              Reroll
            </button>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
