import { AnimatePresence, motion } from "framer-motion";

export function DropReveal({ reward }) {
  return (
    <AnimatePresence>
      {reward ? (
        <motion.div
          key={reward.itemId}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-[32px] border border-amber-400/25 bg-gradient-to-br from-amber-400/12 via-black/20 to-sky-400/10 p-6 shadow-neon"
        >
          <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Latest Drop</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
            <img
              src={reward.image}
              alt={reward.name}
              className="h-32 w-32 rounded-3xl border border-white/8 bg-black/20 object-contain p-3"
            />
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white">{reward.name}</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                <span>Float {reward.float.toFixed(4)}</span>
                <span>{reward.wear}</span>
                <span style={{ color: reward.rarity.color }}>{reward.rarity.name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-white">${reward.price.toFixed(2)}</p>
              <p className="text-sm text-slate-400">Sell for ${reward.sellPrice.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
