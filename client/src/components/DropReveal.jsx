import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const trackRef = useRef(null);
  const scrollAudioRef = useRef(null);
  const revealAudioRef = useRef(null);
  const activeRevealIdRef = useRef("");
  
  // Références pour les minuteurs
  const finishTimeoutRef = useRef(null);
  const scrollIntervalRef = useRef(null);

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

  // Gestion responsive de la largeur des cartes
  useLayoutEffect(() => {
    if (!viewportRef.current) return undefined;
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

  // NETTOYAGE SÉCURISÉ : On coupe les sons/timers uniquement quand on détruit le composant
  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  // LOGIQUE DE L'ANIMATION (Isolée des re-renders)
  useEffect(() => {
    const revealId = opening?.revealId || reward?.itemId || "";
    const duration = opening?.reel?.durationMs || 5000;

    if (!reward || !items.length || !viewportRef.current || !trackRef.current || !revealId) {
      return;
    }

    // Protection : Si l'animation de CE drop est déjà lancée, on annule pour ne pas la couper.
    if (activeRevealIdRef.current === revealId) {
      return;
    }

    activeRevealIdRef.current = revealId;
    setPhase("spinning");

    const viewportWidth = viewportRef.current.clientWidth;
    const trackEl = trackRef.current;
    
    // On recalcule ici la taille pour s'assurer que targetX est parfait
    const currentCardWidth = Math.max(120, (viewportWidth - GAP * (VISIBLE_CARDS - 1)) / VISIBLE_CARDS);
    const step = currentCardWidth + GAP;
    
    const winnerCenter = winnerIndex * step + currentCardWidth / 2;
    const targetX = viewportWidth / 2 - winnerCenter;
    
    const startIndex = Math.max(2, Math.min(5, Math.max(items.length - VISIBLE_CARDS, 2)));
    const startCenter = startIndex * step + currentCardWidth / 2;
    const startX = viewportWidth / 2 - startCenter;

    // Reset de l'animation
    trackEl.style.transition = "none";
    trackEl.style.transform = `translate3d(${startX}px, 0, 0)`;

    // Force le navigateur à appliquer la position de départ avant d'animer
    void trackEl.offsetWidth;

    // Lancement
    trackEl.style.transition = `transform ${duration}ms cubic-bezier(0.06, 0.88, 0.18, 1)`;
    trackEl.style.transform = `translate3d(${targetX}px, 0, 0)`;

    // Son "clic-clic" de la roulette
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    scrollIntervalRef.current = window.setInterval(() => {
      playAudio(scrollAudioRef, SCROLL_SOUND, volume);
    }, 95);

    // Fin de l'animation
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    finishTimeoutRef.current = window.setTimeout(() => {
      if (scrollIntervalRef.current) window.clearInterval(scrollIntervalRef.current);
      setPhase("settled");
      playAudio(
        revealAudioRef,
        isLegendary(reward.rarity?.name) ? LEGENDARY_REVEAL_SOUND : BASIC_REVEAL_SOUND,
        volume
      );
      onRevealEnd?.();
    }, duration);

    // ATTENTION : Pas de `return` de nettoyage ici, sinon React tue l'animation au moindre re-render !
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening?.revealId]); // <-- Ne dépend QUE de l'ID pour ne pas s'interrompre

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
            <div ref={viewportRef} className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-[linear-gradient(90deg,rgba(58,61,67,0.92)_0%,rgba(58,61,67,0)_100%)]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-[linear-gradient(270deg,rgba(58,61,67,0.92)_0%,rgba(58,61,67,0)_100%)]" />
              <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full w-[4px] -translate-x-1/2 bg-[#ead95f] shadow-[0_0_20px_rgba(234,217,95,0.85)]" />

              <div
                ref={trackRef}
                className="flex will-change-transform"
                style={{
                  width: `${trackWidth}px`,
                  gap: `${GAP}px`
                }}
              >
                {items.map((item, index) => {
                  // CORRECTION : Le skin gagnant reste illuminé à la fin (settled)
                  const isWinner = index === winnerIndex;
                  const isGlowing = (phase === "spinning" && Math.abs(index - winnerIndex) <= 2) || (phase === "settled" && isWinner);

                  return (
                    <div
                      key={item.itemId || `${item.name}-${index}`}
                      className="relative h-[200px] shrink-0 overflow-hidden rounded-[2px] border border-black/25 bg-[linear-gradient(180deg,rgba(124,122,124,0.72)_0%,rgba(98,100,106,0.8)_72%,rgba(74,78,84,0.97)_100%)] transition-shadow duration-300"
                      style={{
                        width: `${cardWidth}px`,
                        boxShadow: isGlowing ? rarityShadow(item.rarity?.name) : "none",
                        zIndex: isWinner && phase === "settled" ? 10 : 1
                      }}
                    >
                      <div className="absolute inset-x-0 top-0 h-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_100%)]" />
                      <img
                        src={item.image}
                        alt={item.name}
                        className="mx-auto mt-5 h-32 w-32 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
                      />
                      {isGlowing ? (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
                      ) : null}
                      <div
                        className="absolute bottom-0 left-0 h-[4px] w-full"
                        style={{ backgroundColor: item.rarity?.color || "#6b7280" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {phase === "settled" ? (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onSellReward?.(reward.itemId)}
                disabled={busy}
                className="rounded-[10px] border border-[#4fb64d] bg-[linear-gradient(180deg,#20471e_0%,#183517_100%)] px-6 py-2 text-lg font-semibold text-[#88ff7b] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
              >
                Sell for {currency(reward.sellPrice)}
              </button>
              <button
                type="button"
                onClick={() => onReroll?.(reward.crateId)}
                disabled={busy}
                className="rounded-[10px] border border-[#3e8fd3] bg-[linear-gradient(180deg,#3d4c59_0%,#32404e_100%)] px-8 py-2 text-lg font-semibold text-[#d9e5ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
              >
                Reroll
              </button>
            </div>
          ) : (
            <div className="mt-4 h-[52px]" />
          )}
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}