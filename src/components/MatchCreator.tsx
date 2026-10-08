import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { publishGame } from "@/lib/games.functions";
import type React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Copy, FileUp, KeyRound, Loader2, Lock, LockOpen, Plus, ScanLine, Settings2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fluctuateOdds, generateOdds, moveOdds, orderedSelections, selectionLabel, type Fixture, type Market, type MatchOdds, type Selection } from "@/lib/odds";
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
  const [oddsDrafts, setOddsDrafts] = useState<Record<string, string>>({});
  const closesAt = date && deadline ? new Date(`${date}T${deadline}`) : null;
  const deadlineError = closesAt && closesAt.getTime() <= Date.now() ? "Deadline must be in the future" : "";
  const featuredId = matches.some((m) => m.id === featured) ? featured : "";
  const ready = !!closesAt && !deadlineError && !!featuredId;
  const quick = (mins: number) => { const d = new Date(Date.now() + mins * 60000); setDate(localDate(d)); setDeadline(d.toTimeString().slice(0, 5)); };

  useEffect(() => {
    if (admin || locked || matches.length === 0) return;
    const timer = window.setInterval(() => {
      setMatches((current) => current.map((match) => ({
        ...match,
        selections: match.selections.map((selection) => selection.locked || selection.hidden ? selection : { ...selection, ...fluctuateOdds(selection.odds) }),
      })));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [admin, locked, matches.length, setMatches]);

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

  const editOdds = (id: string, key: string, value: string) => {
    const draftKey = `${id}:${key}`;
    setOddsDrafts((current) => ({ ...current, [draftKey]: value }));
    const odds = Number(value);
    if (value.trim() === "" || !Number.isFinite(odds)) return;
    setMatches((current) => current.map((match) => match.id !== id ? match : { ...match, selections: match.selections.map((selection) => selection.key === key ? { ...selection, odds, trend: "same" } : selection) }));
  };
  const updateSelections = (id: string, keys: string[], change: (selection: Selection) => Selection) => setMatches((current) => current.map((match) => match.id !== id ? match : { ...match, selections: match.selections.map((selection) => keys.includes(selection.key) ? change(selection) : selection) }));
  const toggleLock = (id: string, key: string) => updateSelections(id, [key], (selection) => ({ ...selection, locked: !selection.locked }));
  const moveGroup = (id: string, keys: string[], delta: number) => updateSelections(id, keys, (selection) => ({ ...selection, ...moveOdds(selection.odds, delta) }));
  const hideGroup = (id: string, keys: string[]) => updateSelections(id, keys, (selection) => ({ ...selection, hidden: true }));

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
              {open === m.id && (admin ? (
                <AdminOddsGrid
                  match={m}
                  oddsDrafts={oddsDrafts}
                  onEdit={editOdds}
                  onLock={toggleLock}
                  onMove={moveGroup}
                  onHide={hideGroup}
                  onRemove={() => setMatches((current) => current.filter((match) => match.id !== m.id))}
                />
              ) : (
                <div className="space-y-3 border-t border-border p-3">
                  {MARKETS.map((market) => {
                    const selections = orderedSelections(m.selections, market).filter((selection) => !selection.hidden);
                    if (!selections.length) return null;
                    return (
                      <div key={market}>
                        <p className="mb-1.5 text-[9px] font-bold uppercase text-muted-foreground">{market}</p>
                        <div className={`grid gap-1.5 ${market === "Over/Under" ? "grid-cols-2" : "grid-cols-3"}`}>
                          {selections.map((selection) => {
                            const on = isPicked(slip[m.id], selection);
                            const selectionLocked = !!selection.locked;
                            const trend = selection.trend === "up" ? "text-success" : selection.trend === "down" ? "text-destructive" : "text-foreground";
                            return (
                              <Button key={selection.key} variant={on ? "default" : "secondary"} disabled={selectionLocked || isLocked(slip[m.id], selection) || locked} aria-pressed={on} onClick={() => setSlip((current) => togglePick(current, m.id, selection))} className="h-12 flex-col gap-0 text-[10px] disabled:opacity-60">
                                <span className={on ? "" : "text-muted-foreground"}>{selectionLabel(selection)}</span>
                                {selectionLocked ? <span className="flex items-center gap-1 text-[9px] font-black text-warning"><Lock size={10} /> LOCKED</span> : <span className={`font-mono text-xs font-black ${on ? "" : trend}`}>{selection.odds.toFixed(3)}</span>}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
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

function AdminOddsGrid({ match, oddsDrafts, onEdit, onLock, onMove, onHide, onRemove }: {
  match: MatchOdds;
  oddsDrafts: Record<string, string>;
  onEdit: (id: string, key: string, value: string) => void;
  onLock: (id: string, key: string) => void;
  onMove: (id: string, keys: string[], delta: number) => void;
  onHide: (id: string, keys: string[]) => void;
  onRemove: () => void;
}) {
  const visible = (market: Market) => orderedSelections(match.selections, market).filter((selection) => !selection.hidden);
  const resultSections: Array<{ title: string; market: Market }> = [{ title: "1X2", market: "1X2" }, { title: "Double chance", market: "Double Chance" }];
  const goals = ["2.5", "3.5", "4.5"];
  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <h3 className="flex min-w-0 items-center gap-2 text-xs font-black"><Settings2 size={17} className="shrink-0 text-primary" /> Admin Panel - Match Odds Management</h3>
        <Button variant="outline" size="sm" onClick={onRemove} className="shrink-0 text-[9px] text-destructive"><X /> Remove Market</Button>
      </div>
      {resultSections.map(({ title, market }) => {
        const selections = visible(market);
        if (!selections.length) return null;
        const keys = selections.map((selection) => selection.key);
        return (
          <section key={market} className="space-y-2 border-b border-border p-3">
            <h4 className="text-sm font-bold text-primary">{title}</h4>
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[34rem] grid-cols-[repeat(3,minmax(6.5rem,1fr))_11rem_4.25rem] overflow-hidden rounded-md border border-border bg-field">
                {selections.map((selection) => <OddsCell key={selection.key} matchId={match.id} selection={selection} draft={oddsDrafts[`${match.id}:${selection.key}`]} onEdit={onEdit} onLock={onLock} />)}
                <FluctuationCell onUp={() => onMove(match.id, keys, 0.1)} onDown={() => onMove(match.id, keys, -0.1)} />
                <RemoveCell label onClick={() => onHide(match.id, keys)} />
              </div>
            </div>
          </section>
        );
      })}
      {visible("Over/Under").length > 0 && (
        <section className="space-y-2 p-3">
          <h4 className="text-sm font-bold text-primary">Over/under</h4>
          <div className="space-y-1.5 overflow-x-auto pb-1">
            {goals.map((line) => {
              const selections = visible("Over/Under").filter((selection) => selection.key.endsWith(line));
              if (!selections.length) return null;
              const keys = selections.map((selection) => selection.key);
              return (
                <div key={line} className="grid min-w-[34rem] grid-cols-[repeat(2,minmax(9.75rem,1fr))_11rem_4.25rem] overflow-hidden rounded-md border border-border bg-field">
                  {selections.map((selection) => <OddsCell key={selection.key} matchId={match.id} selection={selection} draft={oddsDrafts[`${match.id}:${selection.key}`]} onEdit={onEdit} onLock={onLock} />)}
                  <FluctuationCell onUp={() => onMove(match.id, keys, 0.1)} onDown={() => onMove(match.id, keys, -0.1)} />
                  <RemoveCell onClick={() => onHide(match.id, keys)} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function OddsCell({ matchId, selection, draft, onEdit, onLock }: { matchId: string; selection: Selection; draft: string | undefined; onEdit: (id: string, key: string, value: string) => void; onLock: (id: string, key: string) => void }) {
  return (
    <div className="border-r border-border p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-primary">{selectionLabel(selection)}</span>
        <Button variant="ghost" size="icon" onClick={() => onLock(matchId, selection.key)} aria-label={`${selection.locked ? "Unlock" : "Lock"} ${selectionLabel(selection)}`} className={`size-6 ${selection.locked ? "text-warning" : "text-primary"}`}>
          {selection.locked ? <Lock size={13} /> : <LockOpen size={13} />}
        </Button>
      </div>
      <Input inputMode="decimal" value={draft ?? String(selection.odds)} onChange={(event) => onEdit(matchId, selection.key, event.target.value)} className="h-11 bg-surface-raised text-center font-mono text-sm font-black" />
    </div>
  );
}

function FluctuationCell({ onUp, onDown }: { onUp: () => void; onDown: () => void }) {
  return (
    <div className="border-r border-border p-2">
      <span className="mb-2 block text-[10px] text-muted-foreground">fluctuation</span>
      <div className="grid grid-cols-[1fr_2rem_1fr_2rem] gap-1">
        <span className="grid h-10 place-items-center rounded-md border border-input bg-surface-raised font-mono text-xs">0.10</span>
        <Button variant="outline" size="icon" onClick={onUp} aria-label="Increase odds by 0.10" className="h-10 w-8 text-primary"><ChevronRight /></Button>
        <span className="grid h-10 place-items-center rounded-md border border-input bg-surface-raised font-mono text-xs">0.10</span>
        <Button variant="outline" size="icon" onClick={onDown} aria-label="Decrease odds by 0.10" className="h-10 w-8 text-destructive"><ChevronLeft /></Button>
      </div>
    </div>
  );
}

function RemoveCell({ onClick, label = false }: { onClick: () => void; label?: boolean }) {
  return (
    <div className="grid place-items-center p-2">
      {label && <span className="text-center text-[9px] leading-3 text-muted-foreground">remove<br />market</span>}
      <Button variant="ghost" size="icon" onClick={onClick} aria-label="Remove market" className="text-destructive"><X /></Button>
    </div>
  );
}

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
