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
import type { Bet } from "@/lib/bets";
import type { MatchOdds } from "@/lib/odds";
import { slipLines, type Slip } from "@/lib/slip";
import stadiumPitch from "@/assets/stadium-pitch.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Matchday — DLS BET SIM" },
      { name: "description", content: "Build your DLS matchday, follow the featured fixture, and copy the current game code." },
      { property: "og:title", content: "Matchday — DLS BET SIM" },
      { property: "og:description", content: "Build your DLS matchday, follow the featured fixture, and copy the current game code." },
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
  const [bets, setBets] = useState<Bet[]>([]);
  const [betsLoaded, setBetsLoaded] = useState(false);
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

  const time = new Date(seconds * 1000).toISOString().slice(11, 19);

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
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <img src={stadiumPitch} alt="Floodlit football stadium" width={1024} height={1536} className="fixed inset-0 h-full w-full object-cover opacity-30" />
      <div className="fixed inset-0 bg-background/80" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-24 pt-2">
        <header className="mb-2 flex h-14 items-center justify-between px-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/15 text-primary">
              <Gamepad2 size={19} />
            </div>
            <h1 className="truncate pt-1 font-heading text-3xl font-bold uppercase leading-none">DLS BET SIM</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setAdmin((value) => !value)} aria-pressed={admin} className={admin ? "border border-primary/60 text-primary" : "border border-border text-muted-foreground"}>
            <UserCog /> {admin ? "Admin: On" : "Admin: Off"}
          </Button>
        </header>

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

              <section className="glass-panel space-y-3 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Trophy className="mt-0.5 text-warning" size={16} />
                  <h2 className="text-xs font-bold uppercase leading-5 text-muted-foreground">Featured match: <span className="text-foreground">Real Madrid vs Chelsea</span></h2>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
                  <TeamBadge initials="RM" name="Real Madrid" tone="light" />
                  <div className="flex flex-col items-center">
                    <span className="font-heading text-4xl font-bold italic leading-none text-primary">VS</span>
                    <span className="mt-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-extrabold text-muted-foreground">+8 MATCHES</span>
                  </div>
                  <TeamBadge initials="CFC" name="Chelsea" tone="blue" />
                </div>

                <div className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-field">
                  <Clock3 size={14} className="text-muted-foreground" />
                  <span className="text-[11px] font-semibold">CLOSES IN:</span>
                  <span className="font-mono text-base font-black text-destructive">{time}</span>
                </div>

                <div className="flex h-9 items-center justify-center gap-2 overflow-hidden rounded-md border border-border bg-secondary/80 px-3 text-center text-[11px]">
                  <span>🔥</span>
                  <p className="truncate text-muted-foreground">Top Winner: <span className="font-bold text-primary">@Alex</span> won <span className="font-bold text-warning">₦15,000</span> on 12.50 Odds</p>
                </div>

                <Button onClick={() => copyCode("RMCH8-GL-24")} className="h-12 w-full rounded-md text-xs font-black uppercase">
                  <Copy /> Copy game code: RMCH8-GL-24
                </Button>
              </section>

              <MatchCreator admin={admin} notify={setToast} matches={matches} setMatches={setMatches} slip={slip} setSlip={setSlip} onPublished={setGameCode} />
            </div>
          )}

          {tab === "dlshub" && <Hub view={hubView} setView={setHubView} admin={admin} notify={setToast} />}

          {tab === "betslip" && <BetSlip matches={matches} slip={slip} setSlip={setSlip} gameCode={gameCode} notify={setToast} onLoadCode={(g, m, s) => { setGameCode(g); setMatches(m); setSlip(s); setToast("Bet code loaded — enter your stake"); }} onPlace={(b) => { setBets((old) => [b, ...old]); setSlip({}); setTab("history"); setToast("Bet placed — pending result"); }} onBrowse={() => setTab("matchday")} />}

          {tab === "history" && <HistoryView admin={admin} bets={bets} notify={setToast} onSettle={(b) => setBets((old) => old.map((x) => (x.id === b.id ? b : x)))} />}

          {tab === "gamecode" && <GameCodeLoader onLoaded={(code, m) => { setGameCode(code); setMatches(m); setSlip({}); setTab("matchday"); setToast(`${m.length} matches loaded`); }} />}

        </main>
      </div>

      {tab === "matchday" && slipCount > 0 && (
        <Button onClick={() => setTab("betslip")} className="fixed bottom-20 right-4 z-40 h-12 rounded-full px-5 text-xs font-black shadow-xl">
          📋 Bet Slip <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-background px-1.5 text-[10px] text-primary">{slipCount}</span>
        </Button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Main navigation">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button key={id} variant="ghost" onClick={() => { setTab(id); if (id !== "dlshub") setHubView("landing"); }} aria-current={tab === id ? "page" : undefined} className={`h-12 flex-col gap-0.5 px-1 text-[9px] ${tab === id ? "bg-accent text-primary" : "text-muted-foreground"}`}>
              <Icon size={18} /> {label}
            </Button>
          ))}
        </div>
      </nav>

      <div aria-live="polite" className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
        <Check size={15} /> {toast}
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