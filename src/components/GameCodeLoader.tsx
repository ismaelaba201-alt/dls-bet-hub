import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXPIRED, loadGame } from "@/lib/games.functions";
import type { MatchOdds } from "@/lib/odds";

export function GameCodeLoader({ onLoaded }: { onLoaded: (code: string, matches: MatchOdds[], closesAt: string | null) => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const load = async () => {
    if (!code.trim()) { setErr("Enter a game code"); return; }
    setBusy(true); setErr("");
    const r = await loadGame({ data: { code } }).catch(() => ({ error: "Could not load matches.", matches: [] }));
    setBusy(false);
    if ("error" in r && r.error) { setErr(r.error); return; }
    const g = r as { code: string; matches: MatchOdds[]; closesAt: string | null };
    if (g.closesAt && Date.parse(g.closesAt) <= Date.now()) setErr(EXPIRED);
    onLoaded(g.code, g.matches, g.closesAt);
  };
  return (
    <section className="glass-panel mt-4 flex flex-col items-center gap-4 rounded-lg px-6 py-8 text-center">
      <KeyRound className="text-primary" size={38} />
      <h2 className="font-heading text-3xl font-bold uppercase">Enter Game Code</h2>
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="DLS-4RMCH-AB12" aria-label="Enter game code" className="h-12 bg-field text-center font-mono text-lg tracking-widest" />
      {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
      <Button disabled={busy} onClick={load} className="h-12 w-full text-xs font-black uppercase">{busy && <Loader2 className="animate-spin" />} Load matches</Button>
    </section>
  );
}
