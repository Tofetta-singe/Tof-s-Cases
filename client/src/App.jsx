import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "./hooks/useDashboard";
import { api, authApi, getAuthUrl, setSessionToken } from "./lib/api";
import { LiveFeed } from "./components/LiveFeed";
import { StatCard } from "./components/StatCard";
import { CaseCard } from "./components/CaseCard";
import { DropReveal } from "./components/DropReveal";
import { InventoryGrid } from "./components/InventoryGrid";
import { BattlePanel } from "./components/BattlePanel";

function currency(value) {
  return `${Number(value || 0).toFixed(2)} \u20ac`;
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { loading, error, data } = useDashboard(refreshKey);
  const [opening, setOpening] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sellingItemId, setSellingItemId] = useState("");
  const [selectedTradeUp, setSelectedTradeUp] = useState([]);
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    authenticated: false,
    discordEnabled: false
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      setSessionToken(token);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    let cancelled = false;

    async function hydrateAuth() {
      try {
        const [{ url }, me] = await Promise.allSettled([
          fetch(getAuthUrl()).then(async (response) => {
            const payload = await response.json();
            if (!response.ok) {
              throw new Error(payload.error || "Discord OAuth unavailable");
            }
            return payload;
          }),
          authApi("/me")
        ]);

        if (cancelled) {
          return;
        }

        setAuthStatus({
          loading: false,
          discordEnabled: url.status === "fulfilled",
          authenticated: me.status === "fulfilled"
        });
      } catch {
        if (!cancelled) {
          setAuthStatus({
            loading: false,
            discordEnabled: false,
            authenticated: false
          });
        }
      }
    }

    hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const dashboard = data || {
    user: { inventory: [] },
    cases: [],
    leaderboard: [],
    feed: [],
    battles: []
  };

  const selectedTradeUpItems = useMemo(
    () => dashboard.user.inventory.filter((item) => selectedTradeUp.includes(item.itemId)),
    [dashboard.user.inventory, selectedTradeUp]
  );

  async function openCase(item) {
    setActionError("");
    setIsBusy(true);

    try {
      const result = await api("/cases/open", {
        method: "POST",
        body: JSON.stringify({ caseId: item.id })
      });
      setOpening({
        ...result,
        revealId: `${result.reward.itemId}-${Date.now()}`
      });
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError.message);
      setIsBusy(false);
    }
  }

  async function runTradeUp() {
    if (selectedTradeUp.length !== 10) {
      return;
    }

    setActionError("");
    setIsBusy(true);

    try {
      const result = await api("/contracts/trade-up", {
        method: "POST",
        body: JSON.stringify({ itemIds: selectedTradeUp })
      });
      setOpening({
        reward: result.reward,
        revealId: `${result.reward.itemId}-${Date.now()}`
      });
      setSelectedTradeUp([]);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError.message);
      setIsBusy(false);
    }
  }

  async function sellItem(itemId) {
    setActionError("");
    setSellingItemId(itemId);

    try {
      await api("/inventory/sell", {
        method: "POST",
        body: JSON.stringify({ itemId })
      });
      setSelectedTradeUp((current) => current.filter((id) => id !== itemId));
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSellingItemId("");
    }
  }

  async function loginWithDiscord() {
    const { url } = await fetch(getAuthUrl()).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Discord OAuth unavailable");
      }
      return payload;
    });

    window.location.href = url;
  }

  async function logout() {
    try {
      await authApi("/logout", { method: "POST" });
    } finally {
      setSessionToken("");
      setAuthStatus((current) => ({
        ...current,
        authenticated: false
      }));
      setRefreshKey((value) => value + 1);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-surface p-6 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-surface p-6 text-red-300">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-surface bg-noise text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LiveFeed
          feed={
            dashboard.feed.length
              ? dashboard.feed
              : [
                  {
                    id: "seed-1",
                    username: "Tof",
                    reward: { name: "Karambit | Doppler", price: 1420 }
                  }
                ]
          }
        />

        <header className="relative mt-6 overflow-hidden rounded-[40px] border border-white/8 bg-black/25 p-8 shadow-neon">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,0.22),transparent_30%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_26%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-amber-300">Tof's Cases</p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-none sm:text-6xl">
                Ultimate CS case opening, built for juicy battles.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-slate-300">
                Server-authoritative drops, daily free case, trade-up contracts, live feed and
                synchronized winner-takes-all case battles.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {authStatus.authenticated ? (
                  <button
                    onClick={logout}
                    className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950"
                  >
                    Logout {dashboard.user.username}
                  </button>
                ) : (
                  <button
                    onClick={loginWithDiscord}
                    disabled={!authStatus.discordEnabled}
                    className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {authStatus.loading
                      ? "Checking Discord"
                      : authStatus.discordEnabled
                        ? "Login with Discord"
                        : "Discord Not Configured"}
                  </button>
                )}
                <button className="rounded-full border border-white/10 px-5 py-3 text-sm text-white">
                  Explore Battles
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                {authStatus.authenticated
                  ? "Authenticated session active. Inventory and battles resolve to your Discord account."
                  : "No Discord session detected. The app stays usable in local demo mode until OAuth is configured."}
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Probabilites Valve: Bleu 79.92%, Violet 15.98%, Rose 3.2%, Rouge 0.64%, Or 0.26%.
              </p>
            </div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
              <StatCard label="Balance" value={currency(dashboard.user.balance)} />
              <StatCard label="Inventory Value" value={currency(dashboard.user.totalInventoryValue)} />
              <StatCard
                label="Inventory Skins"
                value={String(dashboard.user.inventory.length).padStart(2, "0")}
              />
            </motion.div>
          </div>
        </header>

        <div className="mt-8 grid gap-8">
          {actionError ? (
            <div className="rounded-3xl border border-red-400/25 bg-red-400/10 px-5 py-4 text-sm text-red-100">
              {actionError}
            </div>
          ) : null}

          <DropReveal
            opening={opening}
            onRevealEnd={() => {
              setIsBusy(false);
            }}
          />

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Cases</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Catalogue officiel CS</h2>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.cases.map((item) => (
                <CaseCard
                  key={item.id}
                  item={item}
                  onOpen={openCase}
                  disabled={
                    isBusy ||
                    (!item.daily && Number(dashboard.user.balance || 0) < Number(item.price || 0))
                  }
                />
              ))}
            </div>
          </section>

          <BattlePanel
            battles={dashboard.battles}
            cases={dashboard.cases}
            currentUser={dashboard.user}
            onBattleRefresh={() => setRefreshKey((value) => value + 1)}
          />

          <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-white/8 bg-panel/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Inventory</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">
                    Rarity-coded visual stash
                  </h2>
                </div>
                <button
                  onClick={runTradeUp}
                  disabled={selectedTradeUp.length !== 10 || isBusy}
                  className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                >
                  Trade Up 10/10
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Select 10 skins of the same rarity to exchange them for one higher-tier drop.
              </p>
              <div className="mt-6">
                <InventoryGrid
                  inventory={dashboard.user.inventory}
                  selectedIds={selectedTradeUp}
                  onSell={sellItem}
                  sellingItemId={sellingItemId}
                  disableActions={isBusy}
                  onToggle={(itemId) =>
                    setSelectedTradeUp((current) =>
                      current.includes(itemId)
                        ? current.filter((id) => id !== itemId)
                        : [...current, itemId].slice(0, 10)
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/8 bg-black/20 p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Trade-Up Queue</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {selectedTradeUp.length}/10 selected
                </h3>
                <div className="mt-4 space-y-3">
                  {selectedTradeUpItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <span className="truncate pr-4 text-sm text-white">{item.name}</span>
                      <span className="text-sm" style={{ color: item.rarity.color }}>
                        {item.rarity.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/8 bg-black/20 p-6">
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Leaderboard</p>
                <div className="mt-4 space-y-3">
                  {dashboard.leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400">#{index + 1}</span>
                        <img src={player.avatar} alt={player.username} className="h-9 w-9 rounded-full" />
                        <span className="text-sm font-medium text-white">{player.username}</span>
                      </div>
                      <span className="text-sm text-amber-300">{currency(player.totalInventoryValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
