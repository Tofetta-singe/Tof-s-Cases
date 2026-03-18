import { motion } from "framer-motion";

function currency(value) {
  return `${Number(value || 0).toFixed(2)}\u20ac`;
}

export function CaseCard({ item, onOpen, disabled }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => onOpen(item)}
      disabled={disabled}
      className="fx-card text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="fx-glow overflow-hidden rounded-[2px] border border-black/25 bg-[rgba(164,164,168,0.72)] shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition-transform duration-300">
        <div className="relative flex h-[148px] items-center justify-center bg-[linear-gradient(180deg,rgba(186,186,190,0.6)_0%,rgba(151,151,155,0.55)_100%)] p-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_52%)]" />
          <img
            src={item.image}
            alt={item.name}
            className={`max-h-[112px] object-contain ${item.daily ? "scale-95" : "scale-100"}`}
          />
        </div>
        <div className="h-[6px] bg-[linear-gradient(90deg,#f8f8f8_0%,#dadbdd_100%)]" />
      </div>
      <div className="px-[2px] pt-2">
        <p className="truncate text-[13px] font-semibold text-white">{item.name}</p>
        <p className="text-[13px] font-bold text-[#5dff61]">{item.price === 0 ? "0.00\u20ac" : currency(item.price)}</p>
      </div>
    </motion.button>
  );
}
