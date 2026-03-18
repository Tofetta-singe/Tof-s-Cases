import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "./hooks/useDashboard";
import { api, authApi, getAuthUrl, setSessionToken } from "./lib/api";
import { CaseCard } from "./components/CaseCard";
import { DropReveal } from "./components/DropReveal";
import { InventoryGrid } from "./components/InventoryGrid";
import { BattlePanel } from "./components/BattlePanel";
import { LiveFeed } from "./components/LiveFeed";

function currency(value) {
  return `${Number(value || 0).toFixed(2)}\u20ac`;
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 fill-[#d7b64a]">
      <path d="M6 7h18l2 2v16H6z" opacity="0.9" />
      <path d="M4 10h22v14H4z" />
      <path d="M8 14h14v6H8z" fill="#72571a" />
      <path d="M20.5 17a1.5 1.5 0 1 1 0 .01z" fill="#e9d277" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 fill-[#76a9d6]">
      <path d="M8 8h16v16H8z" />
      <path d="M6 12h20v12H6z" fill="#5d88ae" />
      <path d="M10 15h8v3h-8z" fill="#d8edf8" />
      <path d="M10 20h4v3h-4z" fill="#d8edf8" />
    </svg>
  );
}

function BattleIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 fill-[#ef7b83]">
      <path d="M7 8l6 6-6 10 4 2 5-9 5 9 4-2-6-10 6-6-3-3-6 6-6-6z" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9">
      <path d="M16 16L16 2A14 14 0 0 1 30 16Z" fill="#5869ff" />
      <path d="M14 18L27 24A14 14 0 0 1 4 24Z" fill="#5a2fb9" />
      <path d="M14 14V2A14 14 0 0 0 3 22Z" fill="#78a6ff" />
      <path d="M16 16h14a14 14 0 0 1-3 8z" fill="#f05ab2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 fill-[#d7d8da]">
      <path d="M18.7 3l.9 3.1a10.8 10.8 0 0 1 2 .8l2.8-1.5 3 5.1-2.5 1.9c.1.4.1.8.1 1.2s0 .8-.1 1.2l2.5 1.9-3 5.1-2.8-1.5c-.6.3-1.3.6-2 .8l-.9 3.1h-5.4l-.9-3.1a10.8 10.8 0 0 1-2-.8L7.6 24l-3-5.1 2.5-1.9A8 8 0 0 1 7 15.8c0-.4 0-.8.1-1.2L4.6 12.7l3-5.1 2.8 1.5a10.8 10.8 0 0 1 2-.8l.9-3.1zm-2.7 8.5A4.5 4.5 0 1 0 16 20.5a4.5 4.5 0 0 0 0-9z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { id: "crates", label: "Crates", icon: WalletIcon },
  { id: "inventory", label: "Inventory", icon: InventoryIcon },
  { id: "battles", label: "Case Battles", icon: BattleIcon },
  { id: "stats", label: "Statistics", icon: StatsIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon }
];

function splitIntoColumns(items, columnsCount) {
  const columns = Array.from({ length: columnsCount }, () => []);

  items.forEach((item, index) => {
    columns[index % columnsCount].push(item);
  });

  return columns;
}

function SettingsPanel({ authStatus, dashboard, loginWithDiscord, logout }) {
  return (
    <section className="cs-panel rounded-[18px] p-5">
      <h3 className="text-[28px] font-bold uppercase text-white">Settings</h3>
      <p className="mt-3 text-lg text-slate-200">
        {authStatus.authenticated
          ? `Connected as ${dashboard.user.username}.`
          : "No Discord session detected. Local demo mode remains available."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {authStatus.authenticated ? (
          <button
            onClick={logout}
            className="rounded-[10px] border border-[#4fb64d] bg-[linear-gradient(180deg,#20471e_0%,#183517_100%)] px-5 py-2 text-lg font-semibold text-[#88ff7b]"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={loginWithDiscord}
            disabled={!authStatus.discordEnabled}
            className="rounded-[10px] border border-[#3e8fd3] bg-[linear-gradient(180deg,#3d4c59_0%,#32404e_100%)] px-5 py-2 text-lg font-semibold text-[#d9e5ef] disabled:opacity-50"
          >
            {authStatus.loading
              ? "Checking Discord"
              : authStatus.discordEnabled
                ? "Login with Discord"
                : "Discord Not Configured"}
          </button>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { loading, error, data } = useDashboard(refreshKey);
  const [opening, setOpening] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [sellingItemId, setSellingItemId] = useState("");
  const [selectedTradeUp, setSelectedTradeUp] = useState([]);
  const [selectedView, setSelectedView] = useState("crates");
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

  const totalNetWorth = useMemo(
    () => Number((Number(dashboard.user.balance || 0) + Number(dashboard.user.totalInventoryValue || 0)).toFixed(2)),
    [dashboard.user.balance, dashboard.user.totalInventoryValue]
  );

  const caseColumns = useMemo(() => {
    const freeCase = dashboard.cases.find((item) => item.id === "free-daily-case");
    const regularCases = dashboard.cases.filter((item) => item.id !== "free-daily-case");
    const regularColumns = splitIntoColumns(regularCases, 3);

    const freeCards = freeCase
      ? [
          { ...freeCase, displayId: "free-case-1", name: "Free Case" },
          { ...freeCase, displayId: "free-case-2", name: "Free Case 2" }
        ]
      : [];

    regularColumns[0] = [...freeCards, ...regularColumns[0]];

    return [
      { title: "CRATES", items: regularColumns[0] },
      { title: "CAPSULES", items: regularColumns[1] },
      { title: "COLLECTIONS", items: regularColumns[2] }
    ];
  }, [dashboard.cases]);

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

  async function rerollCase(caseId) {
    const caseItem = dashboard.cases.find((item) => item.id === caseId);
    if (!caseItem) {
      return;
    }

    await openCase(caseItem);
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
      setOpening((current) => (current?.reward?.itemId === itemId ? null : current));
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSellingItemId("");
      setIsBusy(false);
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
    return <div className="min-h-screen p-6 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen p-6 text-red-200">{error}</div>;
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-6">
        <header className="flex flex-col items-center gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="cs-top-box flex min-w-[206px] flex-col items-center rounded-[12px] border border-[#4e5258] px-6 py-3">
            <p className="text-[30px] font-bold leading-none text-[#7fe06a]">
              {currency(dashboard.user.balance)}
            </p>
            <p className="text-[19px] font-bold leading-none text-[#78ff63]">Wallet</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = selectedView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedView(item.id)}
                  className={`cs-top-box flex w-[112px] flex-col items-center rounded-[12px] border px-3 py-2 transition ${
                    active ? "border-[#d1d4da] bg-[rgba(103,108,115,0.96)]" : "border-[#4e5258]"
                  }`}
                >
                  <Icon />
                  <span className="mt-1 text-[14px] font-bold leading-none text-white">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="cs-top-box flex min-w-[206px] flex-col items-center rounded-[12px] border border-[#4e5258] px-6 py-3">
            <p className="text-[30px] font-bold leading-none text-[#9ac8f0]">{currency(totalNetWorth)}</p>
            <p className="text-[19px] font-bold leading-none text-[#7cc3ff]">Net Worth</p>
          </div>
        </header>

        <div className="mt-5">
          {actionError ? (
            <div className="mb-4 rounded-[10px] border border-red-300/25 bg-red-500/12 px-4 py-3 text-base text-red-100">
              {actionError}
            </div>
          ) : null}

          <DropReveal
            opening={opening}
            busy={isBusy || Boolean(sellingItemId)}
            onRevealEnd={() => setIsBusy(false)}
            onSellReward={sellItem}
            onReroll={rerollCase}
          />
        </div>

        {selectedView === "crates" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            {caseColumns.map((column) => (
              <div key={column.title}>
                <h2 className="mb-3 text-center text-[34px] font-bold uppercase tracking-tight text-white/90">
                  {column.title}
                </h2>
                <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-1">
                  {column.items.map((item) => (
                    <CaseCard
                      key={item.displayId || item.id}
                      item={item}
                      onOpen={openCase}
                      disabled={
                        isBusy ||
                        (!item.daily && Number(dashboard.user.balance || 0) < Number(item.price || 0))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {selectedView === "inventory" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="cs-panel rounded-[18px] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-[28px] font-bold uppercase text-white">Inventory</h3>
                  <p className="text-lg text-slate-200">Select 10 skins of the same rarity for a trade-up.</p>
                </div>
                <button
                  onClick={runTradeUp}
                  disabled={selectedTradeUp.length !== 10 || isBusy}
                  className="rounded-[10px] border border-[#4fb64d] bg-[linear-gradient(180deg,#20471e_0%,#183517_100%)] px-5 py-2 text-lg font-semibold text-[#88ff7b] disabled:opacity-50"
                >
                  Trade Up 10/10
                </button>
              </div>
              <div className="mt-5">
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

            <div className="cs-panel rounded-[18px] p-5">
              <h3 className="text-[28px] font-bold uppercase text-white">Trade Queue</h3>
              <div className="mt-4 space-y-3">
                {selectedTradeUpItems.map((item) => (
                  <div
                    key={item.itemId}
                    className="rounded-[10px] border border-white/10 bg-black/15 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-lg text-white">{item.name}</span>
                      <span className="text-base font-semibold" style={{ color: item.rarity.color }}>
                        {item.rarity.name}
                      </span>
                    </div>
                  </div>
                ))}
                {!selectedTradeUpItems.length ? (
                  <p className="text-lg text-slate-300">No skins selected.</p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {selectedView === "battles" ? (
          <div className="mt-6">
            <BattlePanel
              battles={dashboard.battles}
              cases={dashboard.cases}
              currentUser={dashboard.user}
              onBattleRefresh={() => setRefreshKey((value) => value + 1)}
            />
          </div>
        ) : null}

        {selectedView === "stats" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="cs-panel rounded-[18px] p-5">
              <h3 className="text-[28px] font-bold uppercase text-white">Live Feed</h3>
              <div className="mt-4">
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
              </div>
            </div>

            <div className="cs-panel rounded-[18px] p-5">
              <h3 className="text-[28px] font-bold uppercase text-white">Leaderboard</h3>
              <div className="mt-4 space-y-3">
                {dashboard.leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-[10px] border border-white/10 bg-black/15 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-slate-300">#{index + 1}</span>
                      <img src={player.avatar} alt={player.username} className="h-10 w-10 rounded-full" />
                      <span className="text-lg font-semibold text-white">{player.username}</span>
                    </div>
                    <span className="text-lg font-bold text-[#84d2ff]">{currency(player.totalInventoryValue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {selectedView === "settings" ? (
          <div className="mt-6">
            <SettingsPanel
              authStatus={authStatus}
              dashboard={dashboard}
              loginWithDiscord={loginWithDiscord}
              logout={logout}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
