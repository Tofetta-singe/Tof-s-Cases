import { motion } from "framer-motion";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} \u20ac`;
}

export function CaseCard({ item, onOpen, disabled }) {
  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(item)}
      disabled={disabled}
      className="group rounded-[28px] border border-white/8 bg-gradient-to-b from-white/8 to-white/[0.03] p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
            {item.daily ? "Daily" : "Case"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{item.name}</h3>
          <p className="mt-2 text-sm text-slate-400">{item.skinsCount} skins inside</p>
        </div>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-20 w-20 rounded-2xl object-contain drop-shadow-[0_12px_24px_rgba(245,196,81,0.25)]"
          />
        ) : null}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-slate-400">Valve odds</span>
        <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-950">
          {item.price === 0 ? "FREE" : currency(item.price)}
        </span>
      </div>
    </motion.button>
  );
}
