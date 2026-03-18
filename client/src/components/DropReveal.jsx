import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BASIC_REVEAL_SOUND = "/sound_ui_item_drop_basic.wav";
const LEGENDARY_REVEAL_SOUND = "/sound_ui_item_reveal5_legendary.wav";
const SCROLL_SOUND = "/sound_ui_csgo_ui_crate_item_scroll.wav";
const GAP = 12;
const VISIBLE_CARDS = 6;
const SCROLL_AUDIO_POOL_SIZE = 7;

function currency(value) {
  return `${Number(value || 0).toFixed(2)}\u20ac`;
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
  if (rarityName === "Restricted") {
    return "0 0 18px rgba(87, 126, 255, 0.24)";
  }
  return "none";
}

function createScrollAudioPool(src) {
  return Array.from({ length: SCROLL_AUDIO_POOL_SIZE }, () => {
    const audio = new Audio(src);
    audio.preload = "auto";
    return audio;
  });
}

function playLayeredTick(poolRef, indexRef, volume, progress) {
  if (!poolRef.current.length) {
    poolRef.current = createScrollAudioPool(SCROLL_SOUND);
  }

  const audio = poolRef.current[indexRef.current];
  indexRef.current = (indexRef.current + 1) % poolRef.current.length;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = Math.max(0.08, volume * 0.55);
  audio.playbackRate = 0.92 + progress * 0.18;
  audio.play().catch(() => {});
}

function playReveal(audioRef, src, volume) {
  if (!audioRef.current) {
    audioRef.current = new Audio(src);
  }

  audioRef.current.pause();
  audioRef.current.currentTime = 0;
  audioRef.current.src = src;
  audioRef.current.volume = volume;
  audioRef.current.play().catch(() => {});
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
  const trackRef = useRef(null);
  const scrollAudioPoolRef = useRef([]);
  const scrollAudioIndexRef = useRef(0);
  const revealAudioRef = useRef(null);
  const activeRevealIdRef = useRef("");
  const finishTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  const reward = opening?.reward || null;
  const items = opening?.reel?.items || [];
  const winnerIndex = opening?.reel?.winnerIndex ?? 0;
  const rewardRarityColor = reward?.rarity?.color || "#6b7280";
  const rewardTitleParts = useMemo(() => {
    if (!reward?.name) {
      return { weapon: "", skin: "" };
    }
    const [weapon, skin] = reward.name.split(" | ");
    return { weapon: weapon || reward.name, skin: skin || "" };
  }, [reward?.name]);
  const revealParticles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        left: `${6 + index * 6.5}%`,
        size: 6 + (index % 4) * 3,
        delay: index * 0.07,
        duration: 1.8 + (index % 3) * 0.35
      })),
    []
  );

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
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollAudioPoolRef.current = createScrollAudioPool(SCROLL_SOUND);

    return () => {
      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      for (const audio of scrollAudioPoolRef.current) {
        audio.pause();
      }
    };
  }, []);

  useEffect(() => {
    const revealId = opening?.revealId || reward?.itemId || "";
    const duration = opening?.reel?.durationMs || 5000;

    if (!reward || !items.length || !viewportRef.current || !trackRef.current || !revealId) {
      return undefined;
    }

    if (activeRevealIdRef.current === revealId) {
      return undefined;
    }

    activeRevealIdRef.current = revealId;
    setPhase("spinning");

    const viewportWidth = viewportRef.current.clientWidth;
    const trackEl = trackRef.current;
    const currentCardWidth = Math.max(120, (viewportWidth - GAP * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS);
    const step = currentCardWidth + GAP;
    const winnerCenter = winnerIndex * step + currentCardWidth / 2;
    const targetX = viewportWidth / 2 - winnerCenter;
    const startIndex = Math.max(0, Math.min(5, winnerIndex - VISIBLE_CARDS - 1));
    const startCenter = startIndex * step + currentCardWidth / 2;
    const startX = viewportWidth / 2 - startCenter;
    const totalTravel = Math.max(Math.abs(targetX - startX), 1);
    let lastTickIndex = -1;

    trackEl.style.transition = "none";
    trackEl.style.transform = `translate3d(${startX}px, 0, 0)`;
    void trackEl.offsetWidth;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const trackPositionAndPlaySound = () => {
      if (!trackRef.current) {
        return;
      }

      const computedTransform = window.getComputedStyle(trackRef.current).transform;
      const matrix = computedTransform && computedTransform !== "none" ? new DOMMatrix(computedTransform) : null;
      const currentX = matrix ? matrix.m41 : startX;
      const distanceTraveled = Math.abs(currentX - startX);
      const currentTickIndex = Math.floor(distanceTraveled / step);

      if (currentTickIndex > lastTickIndex) {
        const progress = Math.min(distanceTraveled / totalTravel, 1);
        for (let tick = lastTickIndex + 1; tick <= currentTickIndex; tick += 1) {
          playLayeredTick(scrollAudioPoolRef, scrollAudioIndexRef, volume, progress);
        }
        lastTickIndex = currentTickIndex;
      }

      if (distanceTraveled < totalTravel - 1) {
        animationFrameRef.current = requestAnimationFrame(trackPositionAndPlaySound);
      }
    };

    trackEl.style.transition = `transform ${duration}ms cubic-bezier(0.09, 0.84, 0.2, 1)`;
    trackEl.style.transform = `translate3d(${targetX}px, 0, 0)`;
    animationFrameRef.current = requestAnimationFrame(trackPositionAndPlaySound);

    if (finishTimeoutRef.current) {
      window.clearTimeout(finishTimeoutRef.current);
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      setPhase("settled");
      playReveal(
        revealAudioRef,
        isLegendary(reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND,
        volume
      );
      onRevealEnd?.();
    }, duration);

    return () => {
      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [items.length, onRevealEnd, opening?.reel?.durationMs, opening?.revealId, reward, volume, winnerIndex]);

  const trackWidth = items.length ? items.length * cardWidth + Math.max(items.length - 1, 0) * GAP : 0;
  const showFx = phase === "spinning" || phase === "settled";

  return (
    <AnimatePresence>
      {reward ? (
        <motion.section
          key={opening?.revealId || reward.itemId}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="cs-panel fx-panel relative overflow-hidden rounded-[18px] px-5 py-5 md:px-6"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute left-1/2 top-[-120px] h-[240px] w-[240px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,214,102,0.26)_0%,rgba(255,214,102,0)_72%)]"
              animate={{
                scale: phase === "spinning" ? [0.92, 1.08, 0.96] : phase === "settled" ? [1, 1.18, 1.06] : 1,
                opacity: phase === "idle" ? 0.18 : 0.42
              }}
              transition={{ duration: 1.8, repeat: phase === "idle" ? 0 : Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]" />
            {showFx
              ? revealParticles.map((particle) => (
                  <motion.span
                    key={particle.id}
                    className="absolute bottom-10 rounded-full bg-white/70 blur-[1px]"
                    style={{
                      left: particle.left,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`
                    }}
                    animate={{
                      y: [-10, -110 - particle.size * 4],
                      opacity: [0, 0.8, 0],
                      scale: [0.7, 1.1, 0.85]
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                ))
              : null}
          </div>

          <div className="relative z-10 text-center">
            {phase === "settled" ? (
              <motion.h2
                initial={{ scale: 0.96, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[28px] font-bold leading-tight text-white md:text-[34px]"
              >
                {rewardTitleParts.weapon}
                {rewardTitleParts.skin ? (
                  <>
                    {" | "}
                    <span style={{ color: rewardRarityColor }}>{rewardTitleParts.skin}</span>
                  </>
                ) : null}
                <span className="text-slate-300"> ({reward.wear})</span>
              </motion.h2>
            ) : (
              <motion.h2
                animate={{ opacity: [0.72, 1, 0.72] }}
                transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                className="text-[28px] font-bold leading-tight text-slate-100 md:text-[34px]"
              >
                Opening Case...
              </motion.h2>
            )}
          </div>

          <div className="relative z-10 mt-4 overflow-hidden rounded-[10px] border border-white/12 bg-[rgba(90,92,97,0.55)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_52%)]" />
            <div ref={viewportRef} className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-[linear-gradient(90deg,rgba(38,41,47,0.98)_0%,rgba(38,41,47,0)_100%)]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-[linear-gradient(270deg,rgba(38,41,47,0.98)_0%,rgba(38,41,47,0)_100%)]" />
              <motion.div
                className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[4px] -translate-x-1/2 bg-[#ead95f]"
                animate={{
                  boxShadow:
                    phase === "settled"
                      ? [
                          "0 0 18px rgba(234,217,95,0.75)",
                          "0 0 34px rgba(255,209,94,0.95)",
                          "0 0 22px rgba(234,217,95,0.8)"
                        ]
                      : [
                          "0 0 12px rgba(234,217,95,0.55)",
                          "0 0 28px rgba(234,217,95,0.9)",
                          "0 0 14px rgba(234,217,95,0.6)"
                        ]
                }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />

              <div
                ref={trackRef}
                className="flex will-change-transform"
                style={{
                  width: `${trackWidth}px`,
                  gap: `${GAP}px`
                }}
              >
                {items.map((item, index) => {
                  const isWinner = index === winnerIndex;
                  const isNearWinner = Math.abs(index - winnerIndex) <= 2;
                  const isGlowing =
                    (phase === "spinning" && isNearWinner) || (phase === "settled" && isWinner);
                  const cardAnimation =
                    phase === "settled" && isWinner
                      ? { y: [0, -8, 0], scale: [1, 1.03, 1] }
                      : phase === "spinning" && isNearWinner
                        ? { y: [0, -2, 0] }
                        : undefined;
                  const cardTransition = cardAnimation
                    ? {
                        duration: phase === "settled" && isWinner ? 0.7 : 1,
                        repeat: phase === "settled" && isWinner ? 1 : Infinity
                      }
                    : undefined;

                  return (
                    <motion.div
                      key={item.itemId || `${item.name}-${index}`}
                      animate={cardAnimation}
                      transition={cardTransition}
                      className="relative h-[200px] shrink-0 overflow-hidden rounded-[6px] border border-black/25 bg-[linear-gradient(180deg,rgba(124,122,124,0.72)_0%,rgba(98,100,106,0.8)_72%,rgba(74,78,84,0.97)_100%)] transition-shadow duration-300"
                      style={{
                        width: `${cardWidth}px`,
                        boxShadow: isGlowing ? rarityShadow(item.rarity?.name) : "none",
                        zIndex: isWinner && phase === "settled" ? 10 : 1
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_100%)]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_64%)]" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className="mx-auto mt-5 h-32 w-32 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                      />
                      {isGlowing ? (
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_58%)]" />
                      ) : null}
                      <div
                        className="absolute bottom-0 left-0 h-[4px] w-full"
                        style={{ backgroundColor: item.rarity?.color || "#6b7280" }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {phase === "settled" ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 mt-4 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={() => onSellReward?.(reward.itemId)}
                disabled={busy}
                className="rounded-[10px] border border-[#4fb64d] bg-[linear-gradient(180deg,#20471e_0%,#183517_100%)] px-6 py-2 text-lg font-semibold text-[#88ff7b] shadow-[0_10px_22px_rgba(53,119,47,0.22),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:-translate-y-[1px] hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                Sell for {currency(reward.sellPrice)}
              </button>
              <button
                type="button"
                onClick={() => onReroll?.(reward.crateId)}
                disabled={busy}
                className="rounded-[10px] border border-[#3e8fd3] bg-[linear-gradient(180deg,#3d4c59_0%,#32404e_100%)] px-8 py-2 text-lg font-semibold text-[#d9e5ef] shadow-[0_10px_22px_rgba(45,92,142,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:-translate-y-[1px] hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                Reroll
              </button>
            </motion.div>
          ) : (
            <div className="mt-4 h-[52px]" />
          )}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
