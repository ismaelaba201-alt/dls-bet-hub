import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Clock3, Copy, Ticket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { listActiveGames, type ActiveGame } from "@/lib/games.functions";
import { countdown, teamColor, teamInitials } from "@/lib/teams";

export function FeaturedCarousel({ now, refreshKey, onCopy, onLoad }: { now: number; refreshKey: unknown; onCopy: (code: string) => void; onLoad: (code: string) => void }) {
  const [games, setGames] = useState<ActiveGame[] | null>(null);
  const [i, setI] = useState(0);
  const touch = useRef<number | null>(null);

  useEffect(() => { listActiveGames().then(setGames).catch(() => setGames([])); }, [refreshKey]);
  const live = (games ?? []).filter((g) => Date.parse(g.closesAt) > now);
  const n = live.length;
  useEffect(() => {
    if (n < 2) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => window.clearInterval(t);
  }, [n, i]);
  const idx = n ? i % n : 0;

  if (!n) {
    return (
      <section className="glass-panel flex flex-col items-center gap-2 rounded-lg p-6 text-center">
        <Trophy className="text-warning" />
        <p className="text-xs font-bold uppercase text-muted-foreground">{games === null ? "Loading official matches…" : "No official matchday is open right now"}</p>
      </section>
    );
  }

  return (
    <section className="glass-panel overflow-hidden rounded-lg" aria-roledescription="carousel" aria-label="Official matches"
      onTouchStart={(e) => { touch.current = e.touches[0]!.clientX; }}
      onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0]!.clientX - touch.current; touch.current = null; if (Math.abs(dx) > 40) setI((idx + (dx < 0 ? 1 : n - 1)) % n); }}>
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {live.map((g) => (
          <div key={g.code} className="w-full shrink-0 space-y-3 p-4" aria-roledescription="slide">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-sm bg-success/15 px-2 py-0.5 text-[10px] font-black uppercase text-success"><BadgeCheck size={14} /> Official match</span>
              <span className="truncate text-xs font-bold text-foreground">{g.home} vs {g.away}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
              <Crest name={g.home} />
              <div className="flex flex-col items-center">
                <span className="font-heading text-4xl font-bold italic leading-none text-primary">VS</span>
                {g.total > 1 && <span className="mt-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-extrabold text-muted-foreground">+{g.total - 1} MATCHES</span>}
              </div>
              <Crest name={g.away} />
            </div>
            <div className="flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-field">
              <Clock3 size={14} className="text-muted-foreground" />
              <span className="text-[11px] font-semibold">CLOSES IN:</span>
              <span className="font-mono text-base font-black text-destructive">{countdown(Date.parse(g.closesAt) - now)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => onCopy(g.code)} className="h-11 border border-primary/40 text-[10px] font-black uppercase text-primary"><Copy /> Copy game code</Button>
              <Button onClick={() => onLoad(g.code)} className="h-11 text-[10px] font-black uppercase"><Ticket /> Load bet slip</Button>
            </div>
            <p className="text-center font-mono text-[10px] text-muted-foreground">{g.code}</p>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {live.map((g, k) => <button key={g.code} onClick={() => setI(k)} aria-label={`Show matchday ${k + 1}`} aria-current={k === idx} className={`h-1.5 rounded-full transition-all ${k === idx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} />)}
        </div>
      )}
    </section>
  );
}

function Crest({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div className="grid size-14 place-items-center rounded-full border-2 border-foreground/30 text-sm font-black text-foreground shadow-inner" style={{ background: teamColor(name) }}>{teamInitials(name)}</div>
      <span className="max-w-24 truncate text-[11px] font-bold">{name}</span>
    </div>
  );
}
