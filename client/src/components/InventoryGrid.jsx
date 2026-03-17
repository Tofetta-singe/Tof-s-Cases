export function InventoryGrid({ inventory = [], selectedIds = [], onToggle }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {inventory.map((item) => {
        const selected = selectedIds.includes(item.itemId);
        return (
          <button
            type="button"
            key={item.itemId}
            onClick={() => onToggle?.(item.itemId)}
            className={`rounded-3xl border p-4 text-left transition ${
              selected
                ? "border-amber-300 bg-amber-300/10"
                : "border-white/8 bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <div className="flex gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="h-20 w-20 rounded-2xl bg-black/20 object-contain p-2"
              />
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-white">{item.name}</h4>
                <p className="mt-2 text-xs" style={{ color: item.rarity.color }}>
                  {item.rarity.name}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.wear} • {item.float.toFixed(4)}
                </p>
                <p className="mt-2 text-sm text-white">${item.price.toFixed(2)}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
