import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Copy,
  FileUp,
  Gamepad2,
  History,
  KeyRound,
  Banknote,
  Menu,
  Plus,
  Settings2,
  Shirt,
  Trophy,
  X,
} from "lucide-react";

import { MatchCreator } from "@/components/MatchCreator";
import { BetSlip } from "@/components/BetSlip";
import { History as HistoryView } from "@/components/History";
import { GameCodeLoader } from "@/components/GameCodeLoader";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { OfficialHub } from "@/components/OfficialHub";
import { JoinGameModal } from "@/components/JoinGameModal";
import { WalletModals, WalletPills, type WalletModal } from "@/components/Wallet";
import { useWallet } from "@/hooks/use-wallet";
import { EXPIRED, loadGame } from "@/lib/games.functions";
import { isExpired } from "@/lib/teams";
import type { Bet } from "@/lib/bets";
import type { MatchOdds } from "@/lib/odds";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import { slipLines, type Slip } from "@/lib/slip";
import stadiumPitch from "@/assets/stadium-pitch.jpg";
import brandLogo from "@/assets/dls-arena-x-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { DraggableAdmin } from "@/components/DraggableAdmin";
import { Input } from "@/components/ui/input";
import { formatMB } from "@/lib/wallet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DLS ARENA X — PLAY. BET. WIN." },
      { name: "description", content: "DLS ARENA X: create matchdays, share game codes, manage MB and Battle Coins, and follow your bets. PLAY. BET. WIN." },
      { property: "og:title", content: "DLS ARENA X — PLAY. BET. WIN." },
      { property: "og:description", content: "Create matchdays, share game codes, and manage your MB and Battle Coins in DLS ARENA X." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tab = "matchday" | "betslip" | "dlshub" | "menu";
type HubView = "landing" | "apk" | "kits";
type MenuSub = "home" | "history" | "admin";

function Index() {
  const [tab, setTab] = useState<Tab>("matchday");
  const [admin, setAdmin] = useState(false);
  const [toast, setToast] = useState("");
  const [seconds, setSeconds] = useState(872);
  const [hubView, setHubView] = useState<HubView>("landing");
  const [matches, setMatches] = useState<MatchOdds[]>([]);
  const [slip, setSlip] = useState<Slip>({});
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [closesAt, setClosesAt] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [betsLoaded, setBetsLoaded] = useState(false);
  const wallet = useWallet();
  const [walletModal, setWalletModal] = useState<WalletModal>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [menuSub, setMenuSub] = useState<MenuSub>("home");

  useEffect(() => {
    try { setBets(JSON.parse(localStorage.getItem("dls-bets") ?? "[]")); } catch {}
    setBetsLoaded(true);
  }, []);
  useEffect(() => { if (betsLoaded) localStorage.setItem("dls-bets", JSON.stringify(bets)); }, [bets, betsLoaded]);
  const slipCount = slipLines(slip, matches).length;

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 899)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  void seconds;
  const now = Date.now();
  const expired = isExpired(closesAt, now);

  const applyGame = (code: string, m: MatchOdds[], closes: string | null | undefined, s: Slip = {}) => {
    setGameCode(code); setMatches(m); setClosesAt(closes ?? null);
    const locked = isExpired(closes);
    setSlip(locked ? {} : s);
    return locked;
  };
  const loadGameCode = async (code: string) => {
    const r = await loadGame({ data: { code } }).catch(() => ({ error: "Could not load matches.", matches: [] }));
    if ("error" in r && r.error) { setToast(r.error); return; }
    const g = r as { code: string; matches: MatchOdds[]; closesAt: string | null };
    const locked = applyGame(g.code, g.matches, g.closesAt);
    setTab("matchday");
    setToast(locked ? "Betting is closed for this code" : `${g.matches.length} matches loaded`);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast("Game code copied");
    } catch {
      setToast(code);
    }
  };

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setToast("Screenshot added");
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <img src={stadiumPitch} alt="Floodlit football stadium" width={1024} height={1536} className="fixed inset-0 h-full w-full object-cover opacity-30" />
      <div className="fixed inset-0 bg-background/80" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-28 pt-2">
        <header className="sticky top-0 z-40 -mx-3 mb-2 flex min-h-20 shrink-0 items-center justify-between gap-1.5 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-xl" aria-label="DLS ARENA X header">
          <div className="flex min-w-0 items-center gap-1.5">
            <img src={brandLogo.url} alt="DLS ARENA X mascot" width={44} height={44} className="size-9 shrink-0 object-contain sm:size-11" />
            <div className="min-w-0">
              <h1 className="whitespace-nowrap font-heading text-sm font-bold uppercase leading-none sm:text-xl">DLS ARENA <span className="text-warning">X</span></h1>
              <p className="mt-1 text-[7px] font-bold text-warning sm:text-[9px]">PLAY. BET. WIN.</p>
            </div>
          </div>
          <div className="min-w-0 flex-1" aria-hidden="true" />
          <WalletPills wallet={wallet} setModal={setWalletModal} />
        </header>
        <DraggableAdmin admin={admin} onToggle={() => setAdmin((value) => !value)} />

        <main className="flex-1">
          {tab === "matchday" && (
            <div className="space-y-4">
              <section className="glass-panel overflow-hidden rounded-lg p-1">
                <div className="relative aspect-video overflow-hidden rounded-md bg-field">
                  <video className="h-full w-full object-cover" autoPlay loop muted playsInline poster={stadiumPitch}>
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-soccer-player-kicking-the-ball-41130-large.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute left-2 top-2 flex items-center gap-2 rounded-md border border-border bg-background/75 px-3 py-1.5 backdrop-blur-md">
                    <span className="size-2 rounded-full bg-primary animate-live" />
                    <span className="text-[11px] font-bold uppercase">DLS Highlights</span>
                  </div>
                  {admin && (
                    <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-md border border-border bg-background/90 p-2 backdrop-blur-md">
                      <Settings2 className="text-warning" />
                      <span className="flex-1 text-xs text-muted-foreground">Highlight controls enabled</span>
                      <Button size="sm" onClick={() => setToast("Video settings saved")}>Save</Button>
                    </div>
                  )}
                </div>
              </section>

              <FeaturedCarousel now={now} refreshKey={gameCode} onCopy={copyCode} onLoad={loadGameCode} />

              <OfficialHub now={now} onPlay={loadGameCode} />

              <div className="flex h-9 items-center justify-center gap-2 overflow-hidden rounded-md border border-border bg-secondary/80 px-3 text-center text-[11px]">
                <span>🔥</span>
                <p className="truncate text-muted-foreground">Top Winner: <span className="font-bold text-primary">@Alex</span> won <span className="font-bold text-warning">15 GB</span> on 12.50 Odds</p>
              </div>

              {expired && <p role="alert" className="rounded-md border border-destructive/60 bg-destructive/15 p-3 text-xs font-bold text-destructive">{EXPIRED}</p>}

              <MatchCreator admin={admin} notify={setToast} matches={matches} setMatches={setMatches} slip={slip} setSlip={setSlip} onPublished={(c) => { setGameCode(c); setClosesAt(null); }} locked={expired && !admin} />
            </div>
          )}

          {tab === "dlshub" && <Hub view={hubView} setView={setHubView} admin={admin} notify={setToast} />}

          {tab === "betslip" && <BetSlip matches={matches} slip={slip} setSlip={setSlip} gameCode={gameCode} expired={expired} notify={setToast} onLoadCode={(g, m, s, c) => { const locked = applyGame(g, m, c, s); setToast(locked ? "Betting is closed for this code" : "Bet code loaded — enter your stake"); }} onPlace={(b) => { wallet.debit(b.currency ?? "MB", b.stake, "Stake", b.betCode ?? b.id); setBets((old) => [b, ...old]); setSlip({}); setTab("menu"); setMenuSub("history"); setToast("Bet placed — pending result"); }} onBrowse={() => setTab("matchday")} wallet={wallet} openWallet={setWalletModal} onOfficial={() => setJoinOpen(true)} />}

          {tab === "menu" && (
            <MenuView
              sub={menuSub}
              setSub={setMenuSub}
              admin={admin}
              bets={bets}
              wallet={wallet}
              notify={setToast}
              onSettle={(b) => { const prev = bets.find((x) => x.id === b.id); if (b.status === "WON" && prev?.status === "PENDING") wallet.credit(b.currency ?? "MB", b.payout, "Win", b.betCode ?? b.id); setBets((old) => old.map((x) => (x.id === b.id ? b : x))); }}
              onJoinGame={() => setJoinOpen(true)}
              onOpenWallet={(m: WalletModal) => setWalletModal(m)}
              onOfficial={() => setJoinOpen(true)}
            />
          )}

        </main>
      </div>

      {tab === "matchday" && slipCount > 0 && (
        <Button onClick={() => setTab("betslip")} className="fixed bottom-24 right-4 z-40 h-12 rounded-full px-5 text-xs font-black shadow-xl">
          Bet Slip <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-background px-1.5 text-[10px] text-primary">{slipCount}</span>
        </Button>
      )}

      {joinOpen && (
        <JoinGameModal
          onClose={() => setJoinOpen(false)}
          notify={setToast}
          onGameLoaded={(code, m, c) => { setJoinOpen(false); const locked = applyGame(code, m, c); setTab("matchday"); setToast(locked ? "Betting is closed for this code" : `${m.length} matches loaded`); }}
          onBetLoaded={(g, m, s, c) => { setJoinOpen(false); const locked = applyGame(g, m, c, s); setTab("betslip"); setToast(locked ? "Betting is closed for this code" : "Bet slip loaded — enter your stake"); }}
        />
      )}

      <WalletModals wallet={wallet} modal={walletModal} setModal={setWalletModal} admin={admin} notify={setToast} onOfficial={() => setJoinOpen(true)} />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-0.5">
          <NavTab id="matchday" label="Matchday" icon={Trophy} active={tab === "matchday"} onClick={() => { setTab("matchday"); setHubView("landing"); }} />

          <NavTab id="betslip" label="Bet Slip" icon={Banknote} active={tab === "betslip"} onClick={() => setTab("betslip")} badge={slipCount} />

          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              aria-label="Join game"
              className="relative -mt-6 grid size-14 place-items-center rounded-full border-2 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition active:scale-95"
            >
              <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" aria-hidden="true" />
              <KeyRound size={24} className="relative" />
            </button>
            <span className="mt-0.5 text-[8px] font-bold text-primary">Join Game</span>
          </div>

          <NavTab id="dlshub" label="DLS Hub" icon={Gamepad2} active={tab === "dlshub"} onClick={() => setTab("dlshub")} />

          <NavTab id="menu" label="Menu" icon={Menu} active={tab === "menu"} onClick={() => { setTab("menu"); setMenuSub("home"); }} />
        </div>
      </nav>

      <div role="status" aria-live="polite" className={`fixed bottom-24 left-1/2 z-[60] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 whitespace-normal rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
        <Check size={15} className="shrink-0" /> {toast}
      </div>
    </div>
  );
}

function NavTab({ id, label, icon: Icon, active, onClick, badge }: { id: string; label: string; icon: typeof Trophy; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-12 flex-col items-center justify-center gap-0.5 px-1 text-[9px] font-bold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
    >
      {active && <span className="absolute -top-2 h-1 w-8 rounded-full bg-primary shadow-[0_0_8px_2px_var(--color-primary)]" aria-hidden="true" />}
      <span className="relative">
        <Icon size={20} className={active ? "drop-shadow-[0_0_4px_var(--color-primary)]" : ""} />
        {badge != null && badge > 0 && <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[8px] font-black text-destructive-foreground">{badge > 99 ? "99+" : badge}</span>}
      </span>
      {label}
    </button>
  );
}

function MenuView({ sub, setSub, admin, bets, wallet, notify, onSettle, onJoinGame, onOpenWallet, onOfficial }: {
  sub: MenuSub;
  setSub: (s: MenuSub) => void;
  admin: boolean;
  bets: Bet[];
  wallet: ReturnType<typeof useWallet>;
  notify: (m: string) => void;
  onSettle: (b: Bet) => void;
  onJoinGame: () => void;
  onOpenWallet: (m: WalletModal) => void;
  onOfficial: () => void;
}) {
  if (sub === "history") {
    return (
      <section className="space-y-3">
        <Button variant="ghost" onClick={() => setSub("home")} className="px-0 text-xs text-primary"><ArrowLeft /> Back to Menu</Button>
        <HistoryView admin={admin} bets={bets} notify={notify} onSettle={onSettle} />
      </section>
    );
  }

  if (sub === "admin") {
    if (!admin) {
      return (
        <section className="space-y-3">
          <Button variant="ghost" onClick={() => setSub("home")} className="px-0 text-xs text-primary">
            <ArrowLeft /> Back to Menu
          </Button>
          <p className="rounded-md border border-border p-3 text-sm">
            Admin Mode is OFF. Turn it on to access the Admin Control Panel.
          </p>
        </section>
      );
    }

    return (
      <section className="space-y-3">
        <Button variant="ghost" onClick={() => setSub("home")} className="px-0 text-xs text-primary">
          <ArrowLeft /> Back to Menu
        </Button>
        <AdminControlPanel />
      </section>
    );
  }
  
  const pendingCount = bets.filter((b) => b.status === "PENDING").length;
  const settledCount = bets.filter((b) => b.status !== "PENDING").length;

  return (
    <section className="space-y-4">
      <h2 className="px-1 font-heading text-2xl font-bold uppercase">Menu</h2>

      <div className="glass-panel space-y-3 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-md border border-primary/30 bg-primary/10 p-3">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">Data Wallet</p>
            <p className="font-mono text-lg font-black text-primary">{formatMB(wallet.mb)}</p>
          </div>
          <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
            <p className="text-[9px] font-bold uppercase text-muted-foreground">{wallet.settings.currencyName}</p>
            <p className="font-mono text-lg font-black text-warning">{wallet.bc.toLocaleString("en-US")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => onOpenWallet(wallet.profile ? "green" : "activate")} className="h-10 text-[10px] font-black uppercase">Data Wallet</Button>
          <Button variant="secondary" onClick={() => onOpenWallet("bc")} className="h-10 text-[10px] font-black uppercase">{wallet.settings.currencyName}</Button>
        </div>
      </div>

      <div className="glass-panel divide-y divide-border overflow-hidden rounded-lg">
        <MenuRow icon={History} label="Bet History" sub={`${pendingCount} pending • ${settledCount} settled`} onClick={() => setSub("history")} />
        <MenuRow icon={KeyRound} label="Join Game" sub="Enter game or bet slip code" onClick={onJoinGame} />
        <MenuRow icon={Trophy} label="Official Matchdays" sub="Play for real data" onClick={onOfficial} />
        <MenuRow icon={Gamepad2} label="DLS Hub" sub="Kits, logos & APK downloads" onClick={() => { /* handled by nav */ }} />
    {admin && (
  <MenuRow
    icon={Settings2}
    label="Admin Control Panel"
    sub="Manage app administration"
    onClick={() => setSub("admin")}
  />
)}
      </div>

      <p className="text-center text-[9px] text-muted-foreground">DLS ARENA X — PLAY. BET. WIN.</p>
    </section>
  );
}

function MenuRow({ icon: Icon, label, sub, onClick }: { icon: typeof Trophy; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-primary"><Icon size={18} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

function LabeledInput({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-[9px] font-bold uppercase text-muted-foreground">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1 bg-field text-xs text-foreground" />
    </label>
  );
}

function Hub({ view, setView, admin, notify }: { view: HubView; setView: (view: HubView) => void; admin: boolean; notify: (message: string) => void }) {
  if (view !== "landing") {
    const isApk = view === "apk";
    const items = isApk ? ["DLS 2026 Unlimited Coins", "DLS Classic Offline"] : ["Madrid 25/26 Home Kit", "Chelsea 25/26 Crest"];
    return (
      <section className="space-y-3">
        <Button variant="ghost" onClick={() => setView("landing")} className="px-0 text-xs text-primary"><ArrowLeft /> Back to DLS Hub</Button>
        <div className="flex items-center justify-between"><h2 className="font-heading text-2xl font-bold uppercase">{isApk ? "DLS Mod APK Gallery" : "DLS Kits & Logo Codes"}</h2><span className="text-[9px] text-muted-foreground">{isApk ? "DIRECT LINKS" : "2025/2026"}</span></div>
        {items.map((item, index) => (
          <article key={item} className="glass-panel flex items-center gap-3 rounded-lg p-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-md bg-accent text-primary">{isApk ? <Gamepad2 /> : <Shirt />}</div>
            <div className="min-w-0 flex-1"><h3 className="truncate text-xs font-bold">{item}</h3><p className="mt-1 text-[10px] text-muted-foreground">Verified • Version {index + 1}.0</p></div>
            <Button size="icon" onClick={() => notify(isApk ? "Download started" : "Kit code copied")} aria-label={isApk ? "Download" : "Copy kit code"}>{isApk ? <FileUp /> : <Copy />}</Button>
          </article>
        ))}
        {admin && <Button variant="outline" onClick={() => notify("New item form opened")} className="w-full border-dashed text-primary"><Plus /> Add new {isApk ? "APK mod" : "kit & logo"}</Button>}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1"><h2 className="font-heading text-2xl font-bold uppercase">DLS Hub & Downloads</h2><span className="rounded-sm border border-primary/30 bg-accent px-2 py-1 text-[9px] font-bold text-primary">OFFICIAL MODS</span></div>
      <HubCard title="Dream League Soccer APK Mods" description="Available APK mods and direct downloads" label="MOD APK" icon={Gamepad2} onClick={() => setView("apk")} />
      <HubCard title="Dream League Soccer Kit / Logo" description="Copy official club jersey and logo codes" label="KITS & CRESTS" icon={Shirt} onClick={() => setView("kits")} warning />
    </section>
  );
}

function HubCard({ title, description, label, icon: Icon, onClick, warning = false }: { title: string; description: string; label: string; icon: typeof Shirt; onClick: () => void; warning?: boolean }) {
  return (
    <Button variant="outline" onClick={onClick} className="glass-panel h-40 w-full justify-start overflow-hidden rounded-lg p-0 text-left whitespace-normal">
      <div className="grid h-full w-28 shrink-0 place-items-center bg-field text-primary"><Icon size={50} strokeWidth={1.3} /></div>
      <div className="min-w-0 px-4">
        <span className={`inline-block rounded-sm px-2 py-1 text-[9px] font-black ${warning ? "bg-warning text-background" : "bg-primary text-primary-foreground"}`}>{label}</span>
        <h3 className="mt-2 text-sm font-black leading-5">{title}</h3>
        <p className="mt-1 text-[10px] font-normal leading-4 text-muted-foreground">{description}</p>
      </div>
    </Button>
  );
}
