import { motion } from "framer-motion";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function timeAgo(value) {
  if (!value) {
    return "Just now";
  }

  const deltaMs = Date.now() - new Date(value).getTime();
  const deltaMinutes = Math.max(0, Math.floor(deltaMs / 60000));

  if (deltaMinutes < 1) {
    return "Just now";
  }
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const hours = Math.floor(deltaMinutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

export function LiveFeed({ feed = [] }) {
  return (
    <div className="space-y-3">
      {feed.map((event, index) => (
        <motion.div
          key={event.id || `${event.username}-${index}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          className="rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,28,35,0.72)_0%,rgba(11,15,20,0.88)_100%)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {event.reward?.image ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.03] p-2">
                <img src={event.reward.image} alt={event.reward.name} className="max-h-full object-contain" />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{event.username}</p>
                  <p className="truncate text-sm text-slate-300">{event.reward?.name}</p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {timeAgo(event.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span
                  className="rounded-full px-2 py-1 text-xs font-semibold"
                  style={{
                    color: event.reward?.rarity?.color || "#e5e7eb",
                    backgroundColor: `${event.reward?.rarity?.color || "#94a3b8"}22`
                  }}
                >
                  {event.reward?.rarity?.name || "Unknown"}
                </span>
                <span className="text-sm font-semibold text-[#8ff58f]">{currency(event.reward?.price)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
