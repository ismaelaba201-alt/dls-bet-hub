import { useState } from "react";
import { Banknote, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchOdds } from "@/lib/odds";
import type { Bet } from "@/lib/bets";
import { STAKE_MAX, STAKE_MIN, payout, slipLines, stakeError, togglePick, totalOdds, type Slip } from "@/lib/slip";

export function BetSlip({ matches, slip, setSlip, onPlace, onBrowse }: { matches: MatchOdds[]; slip: Slip; setSlip: (s: Slip) => void; onPlace: (b: Bet) => void; onBrowse: () => void }) {
  const [stakeText, setStakeText] = useState("10");
  const lines = slipLines(slip, matches);
  const odds = totalOdds(lines.map((l) => l.selection.odds));
  const stake = stakeText.trim() === "" ? NaN : Number(stakeText);
  const error = stakeError(stake);

  if (!lines.length) {
    return (
      <section className="glass-panel mt-20 flex min-h-72 flex-col items-center justify-center rounded-lg px-8 text-center">
        <Banknote className="mb-4 text-primary" size={38} />
        <h2 className="font-heading text-3xl font-bold uppercase">Bet Slip</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Tap odds on the Matchday screen to add picks.</p>
        <Button onClick={onBrowse} className="mt-4">Go to Matchday</Button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-2xl font-bold uppercase">Bet Slip</h2>
        <Button variant="ghost" size="sm" onClick={() => setSlip({})} className="text-destructive">Clear all</Button>
      </div>
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
        <Button disabled={!!error} onClick={() => {
          if (error) return;
          onPlace({
            id: Date.now().toString(36).toUpperCase(), placedAt: Date.now(), status: "PENDING", totalOdds: odds, stake, payout: payout(odds, stake),
            legs: lines.map(({ match, selection }) => ({ matchId: match.id, home: match.home, away: match.away, time: match.time, market: selection.market, key: selection.key, label: selection.label, odds: selection.odds })),
          });
        }} className="h-12 w-full text-xs font-black uppercase">Place bet</Button>
      </div>
    </section>
  );
}
