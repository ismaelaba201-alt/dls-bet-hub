import { AdminControlPanel } from './admin/AdminControlPanel';
import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listActiveGames, type ActiveGame } from "@/lib/games.functions";
import { countdown } from "@/lib/teams";

export function OfficialHub({ now, onPlay }: { now: number; onPlay: (code: string) => void }) {
  const [games, setGames] = useState<ActiveGame[] | null>(null);
  useEffect(() => { listActiveGames().then(setGames).catch(() => setGames([])); }, []);
  const live = (games ?? []).filter((g) => Date.parse(g.closesAt) > now);
  return (
    <section className="mt-4 space-y-3">
         {/* Admin Control Panel Integration */}
      <AdminControlPanel />
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-2xl font-bold uppercase">Official Game Codes</h2>
        <span className="rounded-sm bg-primary/15 px-2 py-1 text-[9px] font-black text-primary">REAL MB</span>
      </div>
      {games === null && <p className="text-center text-xs text-muted-foreground">Loading official matchdays…</p>}
      {games !== null && !live.length && <p className="glass-panel rounded-lg p-4 text-center text-xs text-muted-foreground">No official matchday is open right now</p>}
      {live.map((g) => (
        <article key={g.code} className="glass-panel space-y-2 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-mono text-xs font-black text-primary"><BadgeCheck size={14} /> {g.code}</span>
            <span className="flex items-center gap-1 font-mono text-xs font-black text-destructive"><Clock3 size={12} /> {countdown(Date.parse(g.closesAt) - now)}</span>
          </div>
          <p className="truncate text-sm font-bold">{g.home} vs {g.away}{g.total > 1 && <span className="text-muted-foreground"> +{g.total - 1} matches</span>}</p>
          <Button onClick={() => onPlay(g.code)} className="h-10 w-full text-xs font-black uppercase"><Play /> Play matchday</Button>
        </article>
      ))}
    </section>
  );
}
