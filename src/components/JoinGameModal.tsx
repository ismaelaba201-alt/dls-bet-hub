import { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Loader2, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXPIRED, loadBetCode, loadGame } from "@/lib/games.functions";
import type { MatchOdds } from "@/lib/odds";
import { slipFromLegs, type Slip } from "@/lib/slip";

type Mode = "gamecode" | "betcode";

export function JoinGameModal({ onClose, onGameLoaded, onBetLoaded, notify }: {
  onClose: () => void;
  onGameLoaded: (code: string, matches: MatchOdds[], closesAt: string | null) => void;
  onBetLoaded: (gameCode: string, matches: MatchOdds[], slip: Slip, closesAt: string | null) => void;
  notify: (m: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("gamecode");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    if (!code.trim()) { setErr("Enter a code"); return; }
    setBusy(true); setErr("");
    try {
      if (mode === "gamecode") {
        const r = await loadGame({ data: { code } }).catch(() => ({ error: "Could not load matches.", matches: [] }));
        if ("error" in r && r.error) { setErr(r.error); return; }
        const g = r as { code: string; matches: MatchOdds[]; closesAt: string | null };
        if (g.closesAt && Date.parse(g.closesAt) <= Date.now()) setErr(EXPIRED);
        onGameLoaded(g.code, g.matches, g.closesAt);
      } else {
        const r = await loadBetCode({ data: { code } }).catch(() => ({ error: "Could not load bet code." }));
        if ("error" in r && r.error) { setErr(r.error); return; }
        const rb = r as { gameCode: string; legs: { matchId: string; key: string }[]; matches: MatchOdds[]; closesAt: string | null };
        const slip = slipFromLegs(rb.legs, rb.matches);
        if (!Object.keys(slip).length) { setErr("This bet code has no valid selections."); return; }
        onBetLoaded(rb.gameCode, rb.matches, slip, rb.closesAt);
      }
    } finally { setBusy(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label="Join game">
      <div className="glass-panel w-full max-w-md space-y-3 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold uppercase">Join Game</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-field p-1">
          {(["gamecode", "betcode"] as const).map((m) => (
            <Button key={m} variant={mode === m ? "default" : "ghost"} size="sm" onClick={() => { setMode(m); setErr(""); setCode(""); }} className="text-[11px] font-black uppercase">
              {m === "gamecode" ? <><KeyRound size={14} /> Game code</> : <><Ticket size={14} /> Bet slip code</>}
            </Button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {mode === "gamecode" ? "Load a matchday with all fixtures and odds." : "Load a friend's pre-selected bet slip picks."}
        </p>
        <Input autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && load()} placeholder={mode === "gamecode" ? "DLS-4RMCH-AB12" : "BC-8829-X"} className="h-12 bg-field text-center font-mono text-lg tracking-widest" />
        {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
        <Button disabled={busy} onClick={load} className="h-12 w-full text-xs font-black uppercase">{busy && <Loader2 className="animate-spin" />} Load code</Button>
      </div>
    </div>,
    document.body,
  );
}
