import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  FileUp,
  Gamepad2,
  History,
  KeyRound,
  Banknote,
  Plus,
  Settings2,
  Shirt,
  Sparkles,
  Trophy,
  UserCog,
  X,
} from "lucide-react";

import { MatchCreator } from "@/components/MatchCreator";
import { BetSlip } from "@/components/BetSlip";
import { History as HistoryView } from "@/components/History";
import { GameCodeLoader } from "@/components/GameCodeLoader";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { OfficialHub } from "@/components/OfficialHub";
import { WalletModals, WalletPills, type WalletModal } from "@/components/Wallet";
import { useWallet } from "@/hooks/use-wallet";
import { EXPIRED, loadGame } from "@/lib/games.functions";
import { isExpired } from "@/lib/teams";
import type { Bet } from "@/lib/bets";
import type { MatchOdds } from "@/lib/odds";
import { slipLines, type Slip } from "@/lib/slip";
import stadiumPitch from "@/assets/stadium-pitch.jpg";
import brandLogo from "@/assets/dls-arena-x-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { DraggableAdmin } from "@/components/DraggableAdmin";
import { Input } from "@/components/ui/input";

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

type Tab = "matchday" | "betslip" | "gamecode" | "dlshub" | "history";
type HubView = "landing" | "apk" | "kits";

const tabs: Array<{ id: Tab; label: string; icon: typeof Trophy }> = [
  { id: "matchday", label: "Matchday", icon: Trophy },
  { id: "betslip", label: "Bet Slip", icon: Banknote },
  { id: "gamecode", label: "Game Code", icon: KeyRound },
  { id: "dlshub", label: "DLS Kits", icon: Shirt },
  { id: "history", label: "History", icon: History },
];


function Index() {
  const [tab, setTab] = useState<Tab>("matchday");
  const [admin, setAdmin] = useState(false);
  const [manual, setManual] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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
  useEffect(() => {
    try { setBets(JSON.parse(localStorage.getItem("dls-bets") ?? "[]")); } catch {}
    setBetsLoaded(true);
  }, []);
  useEffect(() => { if (betsLoaded) localStorage.setItem("dls-bets", JSON.stringify(bets)); }, [bets, betsLoaded]);
  const slipCount = slipLines(slip, matches).length;
  const [fixture, setFixture] = useState({ home: "", away: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 899)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  void seconds; // ticking state re-renders countdowns every second
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
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setToast("Screenshot added");
  };

  const addFixture = () => {
    if (!fixture.home.trim() || !fixture.away.trim()) {
      setToast("Enter both team names");
      return;
    }
    setToast(`${fixture.home} vs ${fixture.away} added`);
    setFixture({ home: "", away: "" });
  };

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <img src={stadiumPitch} alt="Floodlit football stadium" width={1024} height={1536} className="fixed inset-0 h-full w-full object-cover opacity-30" />
      <div className="fixed inset-0 bg-background/80" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-24 pt-2">
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

              <div className="flex h-9 items-center justify-center gap-2 overflow-hidden rounded-md border border-border bg-secondary/80 px-3 text-center text-[11px]">
                <span>🔥</span>
                <p className="truncate text-muted-foreground">Top Winner: <span className="font-bold text-primary">@Alex</span> won <span className="font-bold text-warning">15 GB</span> on 12.50 Odds</p>
              </div>

              {expired && <p role="alert" className="rounded-md border border-destructive/60 bg-destructive/15 p-3 text-xs font-bold text-destructive">{EXPIRED}</p>}

              <MatchCreator admin={admin} notify={setToast} matches={matches} setMatches={setMatches} slip={slip} setSlip={setSlip} onPublished={(c) => { setGameCode(c); setClosesAt(null); }} locked={expired && !admin} />
            </div>
          )}

          {tab === "dlshub" && <Hub view={hubView} setView={setHubView} admin={admin} notify={setToast} />}

          {tab === "betslip" && <BetSlip matches={matches} slip={slip} setSlip={setSlip} gameCode={gameCode} expired={expired} notify={setToast} onLoadCode={(g, m, s, c) => { const locked = applyGame(g, m, c, s); setToast(locked ? "Betting is closed for this code" : "Bet code loaded — enter your stake"); }} onPlace={(b) => { wallet.debit(b.currency ?? "MB", b.stake, "Stake", b.betCode ?? b.id); setBets((old) => [b, ...old]); setSlip({}); setTab("history"); setToast("Bet placed — pending result"); }} onBrowse={() => setTab("matchday")} wallet={wallet} openWallet={setWalletModal} onOfficial={() => setTab("gamecode")} />}

          {tab === "history" && <HistoryView admin={admin} bets={bets} notify={setToast} onSettle={(b) => { const prev = bets.find((x) => x.id === b.id); if (b.status === "WON" && prev?.status === "PENDING") wallet.credit(b.currency ?? "MB", b.payout, "Win", b.betCode ?? b.id); setBets((old) => old.map((x) => (x.id === b.id ? b : x))); }} />}

          {tab === "gamecode" && (
            <>
              <GameCodeLoader onLoaded={(code, m, c) => { if (!applyGame(code, m, c)) { setTab("matchday"); setToast(`${m.length} matches loaded`); } }} />
              <OfficialHub now={now} onPlay={loadGameCode} />
            </>
          )}

        </main>
      </div>

      {tab === "matchday" && slipCount > 0 && (
        <Button onClick={() => setTab("betslip")} className="fixed bottom-20 right-4 z-40 h-12 rounded-full px-5 text-xs font-black shadow-xl">
          📋 Bet Slip <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-background px-1.5 text-[10px] text-primary">{slipCount}</span>
        </Button>
      )}

      <WalletModals wallet={wallet} modal={walletModal} setModal={setWalletModal} admin={admin} notify={setToast} onOfficial={() => setTab("gamecode")} />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button key={id} variant="ghost" onClick={() => { setTab(id); if (id !== "dlshub") setHubView("landing"); }} aria-current={tab === id ? "page" : undefined} className={`h-12 flex-col gap-0.5 px-1 text-[9px] ${tab === id ? "bg-accent text-primary" : "text-muted-foreground"}`}>
              <Icon size={18} /> {label}
            </Button>
          ))}
        </div>
      </nav>

      <div role="status" aria-live="polite" className={`fixed bottom-20 left-1/2 z-[60] flex w-max max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 whitespace-normal rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}>
        <Check size={15} className="shrink-0" /> {toast}
      </div>
    </div>
  );
}

function TeamBadge({ initials, name, tone }: { initials: string; name: string; tone: "light" | "blue" }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div className={`grid size-14 place-items-center rounded-full border-2 text-sm font-black shadow-inner ${tone === "light" ? "border-foreground/70 bg-foreground text-background" : "border-ring bg-ring text-primary-foreground"}`}>{initials}</div>
      <span className="max-w-24 truncate text-[11px] font-bold">{name}</span>
    </div>
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