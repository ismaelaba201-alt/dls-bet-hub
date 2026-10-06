import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Check, History as HistoryIcon, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanScores, fixturesOf, matchScores, settleWithScores, MISMATCH_ERROR, type Bet, type FixtureScore } from "@/lib/bets";
import { scanResults } from "@/lib/scan.functions";

export function History({ bets, onSettle, notify }: { bets: Bet[]; onSettle: (b: Bet) => void; notify: (m: string) => void }) {
  const [view, setView] = useState<"pending" | "settled">("pending");
  const list = bets.filter((b) => (view === "pending" ? b.status === "PENDING" : b.status !== "PENDING")).sort((a, b) => b.placedAt - a.placedAt);

  return (
    <section className="space-y-3">
      <h2 className="px-1 font-heading text-2xl font-bold uppercase">Bet History</h2>
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-field p-1">
        {(["pending", "settled"] as const).map((v) => (
          <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" onClick={() => setView(v)} className="text-xs capitalize">
            {v} ({bets.filter((b) => (v === "pending" ? b.status === "PENDING" : b.status !== "PENDING")).length})
          </Button>
        ))}
      </div>
      {!list.length && (
        <div className="glass-panel flex min-h-48 flex-col items-center justify-center rounded-lg text-center">
          <HistoryIcon className="mb-3 text-primary" size={32} />
          <p className="text-xs text-muted-foreground">No {view} bets yet.</p>
        </div>
      )}
      {list.map((b) => <BetCard key={b.id} bet={b} onSettle={onSettle} notify={notify} />)}
    </section>
  );
}

function BetCard({ bet, onSettle, notify }: { bet: Bet; onSettle: (b: Bet) => void; notify: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<{ image: string; fixtures: FixtureScore[]; note: string } | null>(null);

  const finish = (fixtures: FixtureScore[]) => {
    const out = settleWithScores(bet, fixtures);
    if ("error" in out) { setError(out.error); return false; }
    onSettle(out.bet);
    notify(out.bet.status === "WON" ? "Ticket WON 🎉" : "Ticket settled: LOST");
    return true;
  };
  const blank = () => fixturesOf(bet).map((f) => ({ matchId: f.matchId, home: f.home, away: f.away, homeScore: null, awayScore: null }));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = bad; r.readAsDataURL(file); });
      try {
        const res = await scanResults({ data: { image } });
        if (res.error) { setReview({ image, fixtures: blank(), note: res.error }); return; }
        const m = matchScores(bet, cleanScores(res.scores));
        if (m.complete) finish(m.fixtures);
        else setReview({ image, fixtures: m.fixtures, note: MISMATCH_ERROR + " Please verify or enter the final scores." });
      } catch { setReview({ image, fixtures: blank(), note: "Scores could not be read automatically. Enter them below." }); }
    } catch { setError("Scan failed, try another image"); } finally { setBusy(false); }
  };

  const badge = bet.status === "PENDING" ? "bg-warning text-background" : bet.status === "WON" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground";
  const border = bet.status === "WON" ? "border-success/60" : bet.status === "LOST" ? "border-destructive/60" : "";

  return (
    <article className={`glass-panel space-y-3 rounded-lg p-3 ${border}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold">#{bet.id}</p>
          <p className="text-[10px] text-muted-foreground">{new Date(bet.placedAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-sm px-2 py-1 text-[9px] font-black ${badge}`}>{bet.status === "PENDING" ? "PENDING RESULT" : bet.status}</span>
      </div>
      <ul className="space-y-1.5">
        {bet.legs.map((l) => (
          <li key={l.matchId + l.key} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px] ${l.result === "lost" ? "border-destructive/60 bg-destructive/15" : l.result === "won" ? "border-success/40 bg-success/10" : "border-border bg-field"}`}>
            {l.result === "won" && <Check size={14} className="shrink-0 text-success" />}
            {l.result === "lost" && <X size={14} className="shrink-0 text-destructive" />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{l.home} vs {l.away}{l.score && <span className="ml-1 font-mono text-warning">({l.score})</span>}</p>
              <p className="text-[10px] text-muted-foreground">{l.market} • <span className="text-foreground">{l.label}</span></p>
            </div>
            <span className="font-mono font-black">{l.odds.toFixed(3)}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-2 text-center text-[10px]">
        <div><p className="text-muted-foreground">Total odds</p><p className="font-mono text-xs font-black text-warning">{bet.totalOdds.toFixed(3)}</p></div>
        <div><p className="text-muted-foreground">Stake</p><p className="font-mono text-xs font-black">₦{bet.stake}</p></div>
        <div><p className="text-muted-foreground">{bet.status === "WON" ? "Won" : "Potential"}</p><p className={`font-mono text-xs font-black ${bet.status === "LOST" ? "text-muted-foreground line-through" : "text-primary"}`}>₦{bet.payout.toFixed(2)}</p></div>
      </div>
      {bet.status === "PENDING" && (
        <>
          <input ref={ref} type="file" accept="image/png,image/jpeg" onChange={onFile} className="hidden" />
          <Button disabled={busy} onClick={() => ref.current?.click()} className="h-12 w-full text-[11px] font-black uppercase">
            {busy ? <Loader2 className="animate-spin" /> : <Camera />} {busy ? "Reading scores…" : "Upload match result screenshot"}
          </Button>
          {review && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Confirm final scores">
              <div className="glass-panel flex max-h-[90dvh] w-full max-w-md flex-col rounded-lg">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <h2 className="font-heading text-2xl font-bold uppercase">Confirm Final Scores</h2>
                  <Button variant="ghost" size="icon" onClick={() => setReview(null)} aria-label="Close"><X /></Button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <img src={review.image} alt="Uploaded result screenshot" className="max-h-48 w-full rounded-md border border-border object-contain bg-field" />
                  <p className="rounded-md border border-warning/50 bg-warning/10 p-2 text-[11px] text-warning">{review.note}</p>
                  {review.fixtures.map((f, i) => (
                    <div key={f.matchId} className="grid grid-cols-[1fr_3rem_auto_3rem_1fr] items-center gap-1.5 text-[11px] font-bold">
                      <span className="truncate text-right">{f.home}</span>
                      {(["homeScore", "awayScore"] as const).map((k, idx) => (
                        <Input key={k} type="number" min={0} inputMode="numeric" aria-label={`${idx ? f.away : f.home} goals`} value={f[k] ?? ""} onChange={(e) => { const v = e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))); setReview((r) => r && { ...r, fixtures: r.fixtures.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }); }} className={`h-9 bg-field px-1 text-center text-sm ${idx ? "order-4" : "order-2"}`} />
                      ))}
                      <span className="order-3 text-muted-foreground">-</span>
                      <span className="order-5 truncate">{f.away}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-3">
                  <Button disabled={review.fixtures.some((f) => f.homeScore == null || f.awayScore == null)} onClick={() => { if (finish(review.fixtures)) setReview(null); }} className="h-12 w-full text-xs font-black uppercase">Confirm & settle</Button>
                </div>
              </div>
            </div>
          )}
          {error && <p role="alert" className="rounded-md border border-destructive/60 bg-destructive/15 p-2 text-xs text-destructive">{error}</p>}
        </>
      )}
    </article>
  );
}
