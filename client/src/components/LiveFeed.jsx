import { motion } from "framer-motion";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} \u20ac`;
}

export function LiveFeed({ feed = [] }) {
  return (
    <div className="overflow-hidden rounded-full border border-amber-300/20 bg-black/30 px-4 py-3 shadow-neon">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        className="flex min-w-max gap-4"
      >
        {[...feed, ...feed].map((event, index) => (
          <div
            key={`${event.id || index}-${index}`}
            className="flex items-center gap-3 rounded-full border border-white/8 bg-white/5 px-4 py-2"
          >
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="text-sm text-slate-200">
              {event.username} dropped <strong>{event.reward?.name}</strong> for {currency(event.reward?.price)}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
