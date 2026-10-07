import { useRef, useState, type ChangeEvent } from "react";
import { publishGame } from "@/lib/games.functions";
import type React from "react";
import { ChevronDown, Copy, FileUp, Loader2, Plus, ScanLine, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clampOdds, generateOdds, type Fixture, type Market, type MatchOdds } from "@/lib/odds";
import { scanFixtures } from "@/lib/scan.functions";
import { isLocked, isPicked, togglePick, type Slip } from "@/lib/slip";

const MARKETS: Market[] = ["1X2", "Double Chance", "Over/Under"];

export function MatchCreator({ admin, notify, matches, setMatches, slip, setSlip, onPublished, locked = false }: { admin: boolean; notify: (m: string) => void; matches: MatchOdds[]; setMatches: React.Dispatch<React.SetStateAction<MatchOdds[]>>; slip: Slip; setSlip: React.Dispatch<React.SetStateAction<Slip>>; onPublished?: (code: string) => void; locked?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<Fixture[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [date, setDate] = useState(() => localDate(new Date()));
  const [deadline, setDeadline] = useState("");
  const [featured, setFeatured] = useState("");
  const closesAt = date && deadline ? new Date(`${date}T${deadline}`) : null;
  const deadlineError = closesAt && closesAt.getTime() <= Date.now() ? "Deadline must be in the future" : "";
  const featuredId = matches.some((m) => m.id === featured) ? featured : "";
  const ready = !!closesAt && !deadlineError && !!featuredId;
  const quick = (mins: number) => { const d = new Date(Date.now() + mins * 60000); setDate(localDate(d)); setDeadline(d.toTimeString().slice(0, 5)); };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    try {
      const image = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = bad; r.readAsDataURL(file); });
      const res = await scanFixtures({ data: { image } });
      if (res.error) notify(res.error);
      setDraft(res.fixtures.length ? res.fixtures : [{ home: "", away: "", time: "" }]);
    } catch { notify("Scan failed, try another image"); } finally { setScanning(false); }
  };

  const confirm = () => {
    const valid = (draft ?? []).filter((f) => f.home.trim() && f.away.trim());
    if (!valid.length) return notify("Add at least one full fixture");
    const generated = valid.map((f, i) => generateOdds(f, `${Date.now()}-${i}`));
    setMatches((old) => [...old, ...generated]);
    setOpen(generated[0]!.id);
    setDraft(null);
    setCode("");
    notify(`${generated.length} matches priced`);
  };

  const editOdds = (id: string, key: string, v: string) => setMatches((ms) => ms.map((m) => m.id !== id ? m : { ...m, selections: m.selections.map((s) => s.key === key ? { ...s, odds: Number(v) || s.odds } : s) }));
  const fixOdds = (id: string) => setMatches((ms) => ms.map((m) => m.id !== id ? m : { ...m, selections: m.selections.map((s) => ({ ...s, odds: clampOdds(s.odds) })) }));

  const publish = async () => {
    if (!ready) return;
    const c = `DLS-${matches.length}${matches.map((m) => (m.home[0] ?? "") + (m.away[0] ?? "")).join("").toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const res = await publishGame({ data: { code: c, matches, closesAt: closesAt!.toISOString(), featuredId } }).catch(() => ({ ok: false }));
    if (!res.ok) { notify("Could not publish game code"); return; }
    setCode(c);
    onPublished?.(c);
    navigator.clipboard?.writeText(c).catch(() => {});
    notify("Game code created & added to the homepage");
  };

  return (
    <>
      <section className="glass-panel space-y-3 rounded-lg p-4">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" onChange={onFile} className="hidden" />
        <Button variant="outline" disabled={scanning} onClick={() => inputRef.current?.click()} className="h-32 w-full flex-col border-dashed bg-field text-foreground">
          <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary">{scanning ? <Loader2 className="animate-spin" /> : <ScanLine />}</span>
          <span className="text-xs font-bold">{scanning ? "Scanning fixtures…" : "Upload matchday screenshot"}</span>
          <span className="text-[10px] font-normal text-muted-foreground">PNG or JPG — teams & times are read automatically</span>
        </Button>
        <div className="text-center">
          <Button variant="link" onClick={() => setDraft([{ home: "", away: "", time: "" }])} className="text-xs text-primary">type in matches manually →</Button>
        </div>
      </section>

      {matches.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading text-2xl font-bold uppercase">Matchday Odds</h2>
            <span className="text-[10px] text-muted-foreground">{matches.length} fixtures</span>
          </div>
          {matches.map((m) => (
            <article key={m.id} className="glass-panel overflow-hidden rounded-lg">
              <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full items-center gap-2 p-3 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{m.home} <span className="text-primary">vs</span> {m.away}</p>
                  {m.time && <p className="text-[10px] text-muted-foreground">{m.time}</p>}
                </div>
                {slip[m.id] && <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">{[slip[m.id]!.result, slip[m.id]!.goals].filter(Boolean).join(" + ")}</span>}
                <ChevronDown size={16} className={`transition-transform ${open === m.id ? "rotate-180" : ""}`} />
              </button>
              {open === m.id && (
                <div className="space-y-3 border-t border-border p-3">
                  {MARKETS.map((mk) => (
                    <div key={mk}>
                      <p className="mb-1.5 text-[9px] font-bold uppercase text-muted-foreground">{mk}</p>
                      <div className={`grid gap-1.5 ${mk === "Over/Under" ? "grid-cols-2" : "grid-cols-3"}`}>
                        {m.selections.filter((s) => s.market === mk).map((s) => {
                          const on = isPicked(slip[m.id], s);
                                                    return admin ? (
                            <label key={s.key} className="flex items-center gap-1 rounded-md border border-border bg-field px-2 py-1 text-[10px]">
                              <span className="w-12 shrink-0 text-muted-foreground">{s.label}</span>
                              <Input type="number" step="0.001" min={1.003} max={1.5} value={s.odds} onChange={(e) => editOdds(m.id, s.key, e.target.value)} onBlur={() => fixOdds(m.id)} className="h-7 bg-transparent px-1 text-xs" />
                            </label>
                          ) : (
                            <Button key={s.key} variant={on ? "default" : "secondary"} disabled={isLocked(slip[m.id], s) || locked} aria-pressed={on} onClick={() => setSlip((o) => togglePick(o, m.id, s))} className="h-11 flex-col gap-0 text-[10px] disabled:opacity-30">
                              <span className={on ? "" : "text-muted-foreground"}>{s.label}</span>
                              <span className="font-mono text-xs font-black">{s.odds.toFixed(3)}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {admin && <Button variant="ghost" size="sm" onClick={() => setMatches((ms) => ms.filter((x) => x.id !== m.id))} className="text-destructive"><Trash2 /> Remove fixture</Button>}
                </div>
              )}
            </article>
          ))}

          {admin && (
            <div className="glass-panel space-y-3 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Matchday setup</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[9px] font-bold uppercase text-muted-foreground">Date
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 h-10 bg-field text-xs text-foreground" />
                  <span className="block font-normal normal-case">{date ? new Date(`${date}T00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Required"}</span>
                </label>
                <label className="space-y-1 text-[9px] font-bold uppercase text-muted-foreground">Betting closes at
                  <Input type="time" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={!!deadlineError} className={`mt-1 h-10 bg-field text-xs text-foreground ${deadlineError ? "border-destructive" : ""}`} />
                </label>
              </div>
              <div className="flex gap-1.5">
                {[["15m", 15], ["30m", 30], ["1h", 60], ["3h", 180]].map(([l, m]) => <Button key={l} type="button" variant="secondary" size="sm" onClick={() => quick(m as number)} className="flex-1 text-[10px]">{l}</Button>)}
              </div>
              {deadlineError && <p className="text-xs text-destructive">{deadlineError}</p>}
              <label className="block space-y-1 text-[9px] font-bold uppercase text-muted-foreground">Featured highlight match
                <select value={featuredId} onChange={(e) => setFeatured(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-field px-2 text-xs text-foreground">
                  <option value="">Select the cover match…</option>
                  {matches.map((m) => <option key={m.id} value={m.id}>{m.home} vs {m.away}</option>)}
                </select>
              </label>
              <Button disabled={!ready} onClick={publish} className="h-12 w-full text-xs font-black uppercase">Create bet code</Button>
            </div>
          )}
          {code && (
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(code).catch(() => {}); notify("Game code copied"); }} className="h-11 w-full border border-primary/40 font-mono text-primary"><Copy /> {code}</Button>
          )}
        </section>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Match confirmation">
          <div className="glass-panel flex max-h-[85dvh] w-full max-w-md flex-col rounded-lg">
            <div className="flex items-center justify-between border-b border-border p-3">
              <h2 className="font-heading text-2xl font-bold uppercase">Confirm Matches</h2>
              <Button variant="ghost" size="icon" onClick={() => setDraft(null)} aria-label="Close"><X /></Button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              <div className="grid grid-cols-[1fr_1fr_4.5rem_1.75rem] gap-1.5 text-[9px] font-bold uppercase text-muted-foreground"><span>Home</span><span>Away</span><span>Time</span><span /></div>
              {draft.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_4.5rem_1.75rem] items-center gap-1.5">
                  {(["home", "away", "time"] as const).map((k) => (
                    <Input key={k} value={f[k]} placeholder={k === "time" ? "18:00" : k === "home" ? "Home" : "Away"} onChange={(e) => setDraft((d) => d!.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} className="h-9 bg-field px-2 text-xs" />
                  ))}
                  <Button variant="ghost" size="icon" onClick={() => setDraft((d) => d!.filter((_, j) => j !== i))} aria-label="Remove row" className="size-7 text-destructive"><X /></Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setDraft((d) => [...d!, { home: "", away: "", time: "" }])} className="text-primary"><Plus /> Add row</Button>
            </div>
            <div className="border-t border-border p-3">
              <Button onClick={confirm} className="h-12 w-full text-xs font-black uppercase"><FileUp /> Confirm matches</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
