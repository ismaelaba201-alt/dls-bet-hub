import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Check, History as HistoryIcon, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { settleBet, type Bet } from "@/lib/bets";
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

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await new Promise<string>((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.onerror = bad; r.readAsDataURL(file); });
      const res = await scanResults({ data: { image } });
      if (res.error) { setError(res.error); return; }
      const out = settleBet(bet, res.scores);
      if ("error" in out) { setError(out.error); return; }
      onSettle(out.bet);
      notify(out.bet.status === "WON" ? "Ticket WON 🎉" : "Ticket settled: LOST");
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
          {error && <p role="alert" className="rounded-md border border-destructive/60 bg-destructive/15 p-2 text-xs text-destructive">{error}</p>}
        </>
      )}
    </article>
  );
}
