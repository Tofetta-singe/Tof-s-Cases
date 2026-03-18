function currency(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

export function InventoryGrid({
  inventory = [],
  selectedIds = [],
  onToggle,
  onSell,
  sellingItemId,
  disableActions
}) {
  if (!inventory.length) {
    return (
      <div className="rounded-[18px] border border-dashed border-white/12 bg-black/10 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-white">Your inventory is empty.</p>
        <p className="mt-2 text-sm text-slate-400">Open some cases and your skins will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {inventory.map((item) => {
        const selected = selectedIds.includes(item.itemId);
        return (
          <button
            type="button"
            key={item.itemId}
            onClick={() => onToggle?.(item.itemId)}
            className={`group rounded-[20px] border p-4 text-left transition ${
              selected
                ? "border-[#f2cc63] bg-[linear-gradient(180deg,rgba(82,66,24,0.34)_0%,rgba(33,27,13,0.54)_100%)]"
                : "border-white/8 bg-[linear-gradient(180deg,rgba(34,40,49,0.88)_0%,rgba(14,18,24,0.96)_100%)] hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: item.rarity.color,
                  backgroundColor: `${item.rarity.color}22`
                }}
              >
                {item.rarity.name}
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {selected ? "Selected" : item.wear}
              </span>
            </div>

            <div className="mt-4 flex h-[148px] items-center justify-center rounded-[16px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_58%),linear-gradient(180deg,rgba(76,83,96,0.44)_0%,rgba(28,33,41,0.72)_100%)] p-4">
              <img
                src={item.image}
                alt={item.name}
                className="max-h-[118px] object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>

            <div className="mt-4">
              <h4 className="line-clamp-2 min-h-[44px] text-[15px] font-semibold text-white">{item.name}</h4>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="rounded-[12px] bg-white/[0.04] px-3 py-2">
                  <p className="uppercase tracking-[0.18em] text-slate-500">Float</p>
                  <p className="mt-1 text-sm text-slate-200">{item.float.toFixed(4)}</p>
                </div>
                <div className="rounded-[12px] bg-white/[0.04] px-3 py-2">
                  <p className="uppercase tracking-[0.18em] text-slate-500">Pattern</p>
                  <p className="mt-1 truncate text-sm text-slate-200">#{item.patternSeed}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Value</p>
                <p className="text-lg font-semibold text-white">{currency(item.price)}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSell?.(item.itemId);
                }}
                disabled={disableActions || sellingItemId === item.itemId}
                className="rounded-[12px] border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-50"
              >
                {sellingItemId === item.itemId ? "Selling..." : `Sell ${currency(item.sellPrice)}`}
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
}
