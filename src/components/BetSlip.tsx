import { useState } from "react";
import { createPortal } from "react-dom";
import { Banknote, Loader2, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchOdds } from "@/lib/odds";
import type { Bet } from "@/lib/bets";
import { EXPIRED, createBetCode, loadBetCode } from "@/lib/games.functions";
import { STAKE_MAX, STAKE_MIN, payout, slipFromLegs, slipLines, stakeError, togglePick, totalOdds, type Slip } from "@/lib/slip";

type Props = {
  matches: MatchOdds[]; slip: Slip; setSlip: (s: Slip) => void; gameCode: string | null; expired?: boolean;
  onPlace: (b: Bet) => void; onBrowse: () => void; notify: (m: string) => void;
  onLoadCode: (gameCode: string, matches: MatchOdds[], slip: Slip, closesAt: string | null) => void;
};

export function BetSlip({ matches, slip, setSlip, gameCode, expired = false, onPlace, onBrowse, notify, onLoadCode }: Props) {
  const [stakeText, setStakeText] = useState("10");
  const [placing, setPlacing] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const lines = slipLines(slip, matches);
  const odds = totalOdds(lines.map((l) => l.selection.odds));
  const stake = stakeText.trim() === "" ? NaN : Number(stakeText);
  const error = stakeError(stake);

  const place = async () => {
    if (error || placing || expired) return;
    const legs = lines.map(({ match, selection }) => ({ matchId: match.id, home: match.home, away: match.away, time: match.time, market: selection.market, key: selection.key, label: selection.label, odds: selection.odds }));
    let betCode: string | undefined;
    if (gameCode) {
      setPlacing(true);
      const res = await createBetCode({ data: { gameCode, legs } }).catch(() => ({ error: "Could not create bet code." }));
      setPlacing(false);
      if ("error" in res && res.error) { notify(res.error); return; }
      betCode = (res as { code: string }).code;
    }
    onPlace({ id: Date.now().toString(36).toUpperCase(), placedAt: Date.now(), status: "PENDING", totalOdds: odds, stake, payout: payout(odds, stake), legs, gameCode: gameCode ?? undefined, betCode });
  };

  if (!lines.length) {
    return (
      <>
        <section className="glass-panel mt-20 flex min-h-72 flex-col items-center justify-center rounded-lg px-8 text-center">
          <Banknote className="mb-4 text-primary" size={38} />
          <h2 className="font-heading text-3xl font-bold uppercase">Bet Slip</h2>
          {expired && <p role="alert" className="mt-2 text-xs font-bold text-destructive">{EXPIRED}</p>}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Tap odds on the Matchday screen or load a friend's bet code.</p>
          <div className="mt-4 grid w-full gap-2">
            <Button onClick={onBrowse} className="h-11 text-xs font-black uppercase">Go to Matchday</Button>
            <Button variant="secondary" onClick={() => setCodeOpen(true)} className="h-11 border border-primary/40 text-xs font-black uppercase text-primary"><Ticket /> Enter bet code</Button>
          </div>
        </section>
        {codeOpen && <BetCodeModal onClose={() => setCodeOpen(false)} onLoaded={(g, m, s, c) => { setCodeOpen(false); onLoadCode(g, m, s, c); }} />}
      </>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-2xl font-bold uppercase">Bet Slip</h2>
        <Button variant="ghost" size="sm" onClick={() => setSlip({})} className="text-destructive">Clear all</Button>
      </div>
      {gameCode && <p className="px-1 text-[10px] text-muted-foreground">Game code: <span className="font-mono font-bold text-primary">{gameCode}</span></p>}
      {lines.map(({ match, selection }) => (
        <article key={match.id + selection.key} className="glass-panel flex items-center gap-3 rounded-lg p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{match.home} vs {match.away}</p>
            <p className="text-[10px] text-muted-foreground">{selection.market} • <span className="text-foreground">{selection.label}</span></p>
          </div>
          <span className="font-mono text-sm font-black text-primary">{selection.odds.toFixed(3)}</span>
          <Button variant="ghost" size="icon" onClick={() => setSlip(togglePick(slip, match.id, selection))} aria-label="Remove pick" className="size-8"><X /></Button>
        </article>
      ))}
      <div className="glass-panel space-y-3 rounded-lg p-4">
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total odds</span><span className="font-mono font-black text-warning">{odds.toFixed(3)}</span></div>
        <label className="block space-y-1 text-[10px] font-bold uppercase text-muted-foreground">
          Stake (₦{STAKE_MIN} – ₦{STAKE_MAX})
          <Input type="number" inputMode="decimal" min={STAKE_MIN} max={STAKE_MAX} value={stakeText} onChange={(e) => setStakeText(e.target.value)} aria-invalid={!!error} className={`mt-1 bg-field text-sm text-foreground ${error ? "border-destructive" : ""}`} />
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-between border-t border-border pt-3 text-sm"><span>Potential payout</span><span className="font-mono font-black text-primary">₦{error ? "0.00" : payout(odds, stake).toFixed(2)}</span></div>
        {expired && <p role="alert" className="rounded-md border border-destructive/60 bg-destructive/15 p-2 text-xs font-bold text-destructive">{EXPIRED}</p>}
        <Button disabled={!!error || placing || expired} onClick={place} className="h-12 w-full text-xs font-black uppercase">{placing && <Loader2 className="animate-spin" />} Place bet</Button>
      </div>
    </section>
  );
}

function BetCodeModal({ onClose, onLoaded }: { onClose: () => void; onLoaded: (gameCode: string, matches: MatchOdds[], slip: Slip, closesAt: string | null) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const load = async () => {
    if (!code.trim()) { setErr("Paste a bet code"); return; }
    setBusy(true); setErr("");
    const res = await loadBetCode({ data: { code } }).catch(() => ({ error: "Could not load bet code." }));
    setBusy(false);
    if ("error" in res && res.error) { setErr(res.error); return; }
    const r = res as { gameCode: string; legs: { matchId: string; key: string }[]; matches: MatchOdds[]; closesAt: string | null };
    const slip = slipFromLegs(r.legs, r.matches);
    if (!Object.keys(slip).length) { setErr("This bet code has no valid selections."); return; }
    onLoaded(r.gameCode, r.matches, slip, r.closesAt);
  };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Enter bet code">
      <div className="glass-panel w-full max-w-md space-y-3 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold uppercase">Enter Bet Code</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <Input autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="BC-8829-X" className="h-12 bg-field text-center font-mono text-lg tracking-widest" />
        {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
        <Button disabled={busy} onClick={load} className="h-12 w-full text-xs font-black uppercase">{busy && <Loader2 className="animate-spin" />} Load selections</Button>
      </div>
    </div>,
    document.body,
  );
}
