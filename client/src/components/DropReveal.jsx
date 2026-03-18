import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BASIC_REVEAL_SOUND = "/sound_ui_item_drop_basic.wav";
const LEGENDARY_REVEAL_SOUND = "/sound_ui_item_reveal5_legendary.wav";
const SCROLL_SOUND = "/sound_ui_csgo_ui_crate_item_scroll.wav";
const WINDOW_OFFSETS = [-2, -1, 0, 1, 2, 3];
const CARD_WIDTH = 100 / 6;

function currency(value) {
  return `${Number(value || 0).toFixed(2)}\u20ac`;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
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
    return "0 0 30px rgba(232, 198, 79, 0.35)";
  }

  if (rarityName === "Covert") {
    return "0 0 26px rgba(226, 83, 83, 0.28)";
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
  const [progress, setProgress] = useState(2);
  const scrollAudioRef = useRef(null);
  const revealAudioRef = useRef(null);
  const lastTickRef = useRef(-1);

  const reward = opening?.reward || null;
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

  const winnerIndex = opening?.reel?.winnerIndex ?? 0;
  const baseIndex = Math.floor(progress);
  const progressOffset = progress - baseIndex;

  const visibleItems = useMemo(
    () =>
      WINDOW_OFFSETS.map((offset) => {
        const itemIndex = baseIndex + offset;
        return {
          item: opening?.reel?.items?.[itemIndex] || null,
          itemIndex
        };
      }),
    [baseIndex, opening?.reel?.items]
  );

  useEffect(() => {
    if (!reward) {
      return undefined;
    }

    if (!opening?.reel?.items?.length) {
      setPhase("settled");
      return undefined;
    }

    setPhase("spinning");
    setProgress(2);
    lastTickRef.current = 2;

    const startValue = 2;
    const targetValue = winnerIndex;
    const duration = opening.reel.durationMs || 5000;
    const startTime = performance.now();
    let animationFrame = 0;
    let finished = false;

    const tick = (now) => {
      const elapsed = Math.min(now - startTime, duration);
      const ratio = duration === 0 ? 1 : elapsed / duration;
      const eased = easeOutCubic(ratio);
      const nextValue = startValue + (targetValue - startValue) * eased;
      const boundedValue = Math.min(nextValue, targetValue);
      const discreteTick = Math.floor(boundedValue);

      setProgress(boundedValue);

      if (discreteTick > lastTickRef.current && discreteTick < targetValue) {
        lastTickRef.current = discreteTick;
        playAudio(scrollAudioRef, SCROLL_SOUND, volume);
      }

      if (ratio < 1) {
        animationFrame = window.requestAnimationFrame(tick);
        return;
      }

      if (!finished) {
        finished = true;
        setProgress(targetValue);
        setPhase("settled");
        playAudio(
          revealAudioRef,
          isLegendary(reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND,
          volume
        );
        onRevealEnd?.();
      }
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [opening, onRevealEnd, reward, volume, winnerIndex]);

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
            {phase === "settled" ? (
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
            ) : (
              <h2 className="text-[28px] font-bold leading-tight text-slate-200 md:text-[34px]">
                Opening Case...
              </h2>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-[6px] border border-white/12 bg-[rgba(90,92,97,0.55)] p-3">
            <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-full w-[4px] -translate-x-1/2 bg-[#ead95f]" />
              <motion.div
                className="flex gap-3"
                animate={{ x: `${-progressOffset * CARD_WIDTH}%` }}
                transition={{ ease: "linear", duration: 0.05 }}
              >
                {visibleItems.map(({ item, itemIndex }, index) => {
                  const hiddenWinner = phase !== "settled" && itemIndex === winnerIndex;
                  const itemToRender = hiddenWinner ? null : item;

                  return (
                    <div
                      key={item?.itemId || `placeholder-${index}-${itemIndex}`}
                      className="relative h-[200px] min-w-0 flex-1 overflow-hidden rounded-[2px] border border-black/25 bg-[linear-gradient(180deg,rgba(120,118,120,0.7)_0%,rgba(100,100,106,0.78)_70%,rgba(76,78,84,0.95)_100%)]"
                      style={{
                        boxShadow:
                          phase === "spinning" && itemToRender
                            ? rarityShadow(itemToRender.rarity?.name)
                            : "none"
                      }}
                    >
                      {itemToRender ? (
                        <>
                          <img
                            src={itemToRender.image}
                            alt={itemToRender.name}
                            className="mx-auto mt-5 h-32 w-32 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                          />
                          <div
                            className="absolute bottom-0 left-0 h-[4px] w-full"
                            style={{ backgroundColor: itemToRender.rarity?.color || "#6b7280" }}
                          />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-300/70">
                          Hidden
                        </div>
                      )}
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
