export function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-panel/80 p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.32em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
