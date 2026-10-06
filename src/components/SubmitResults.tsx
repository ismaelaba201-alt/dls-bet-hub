import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanScores, matchFixtureList, type FixtureScore } from "@/lib/bets";
import { loadGame, publishResults } from "@/lib/games.functions";
import { scanResults } from "@/lib/scan.functions";
import { fileToDataUrl } from "@/lib/image";
import type { MatchOdds } from "@/lib/odds";

export function SubmitResults({ notify }: { notify: (m: string) => void }) {
  const [code, setCode] = useState("");
  const [game, setGame] = useState<{ code: string; matches: MatchOdds[] } | null>(null);
  const [busy, setBusy] = useState<"" | "fetch" | "scan" | "publish">("");
  const [err, setErr] = useState("");
  const [image, setImage] = useState("");
  const [fixtures, setFixtures] = useState<FixtureScore[] | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const fetchFixtures = async () => {
    setBusy("fetch"); setErr(""); setFixtures(null); setImage("");
    const r = await loadGame({ data: { code } }).catch(() => ({ error: "Could not fetch fixtures.", matches: [] }));
    setBusy("");
    if ("error" in r && r.error) { setGame(null); setErr(r.error); return; }
    setGame({ code: (r as { code: string }).code, matches: r.matches });
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !game) return;
    setBusy("scan"); setErr("");
    const list = game.matches.map((m) => ({ id: m.id, home: m.home, away: m.away }));
    try {
      const img = await fileToDataUrl(file);
      setImage(img);
      const res = await scanResults({ data: { image: img } }).catch(() => ({ scores: [], error: "Scores could not be read automatically." }));
      setFixtures(matchFixtureList(list, cleanScores(res.scores)));
      if (res.error) setErr(res.error + " Enter scores manually.");
    } catch { setErr("Could not read that image."); } finally { setBusy(""); }
  };

  const publish = async () => {
    if (!game || !fixtures) return;
    setBusy("publish");
    const r = await publishResults({ data: { code: game.code, fixtures, image } }).catch(() => ({ ok: false }));
    setBusy("");
    if (!r.ok) { setErr("Could not publish results."); return; }
    notify(`Results published for ${game.code}`);
    setGame(null); setFixtures(null); setImage(""); setCode("");
  };

  const incomplete = !fixtures || fixtures.some((f) => f.homeScore == null || f.awayScore == null);

  return (
    <section className="glass-panel space-y-3 rounded-lg border-warning/50 p-4">
      <div className="flex items-center gap-2"><ShieldCheck className="text-warning" size={18} /><h2 className="font-heading text-2xl font-bold uppercase">Submit Game Results</h2></div>
      <div className="flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter Game Code" aria-label="Enter Game Code" className="h-11 bg-field font-mono" />
        <Button disabled={!code.trim() || busy === "fetch"} onClick={fetchFixtures} className="h-11 text-[10px] font-black uppercase">{busy === "fetch" && <Loader2 className="animate-spin" />} Fetch fixtures</Button>
      </div>
      {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
      {game && (
        <>
          {!fixtures && (
            <ul className="space-y-1">
              {game.matches.map((m) => <li key={m.id} className="rounded-md border border-border bg-field px-2 py-1.5 text-[11px] font-bold">{m.home} vs {m.away}</li>)}
            </ul>
          )}
          <input ref={ref} type="file" accept="image/png,image/jpeg" onChange={onFile} className="hidden" />
          <Button variant="outline" disabled={busy === "scan"} onClick={() => ref.current?.click()} className="h-20 w-full flex-col border-dashed bg-field text-[11px] font-black uppercase">
            {busy === "scan" ? <Loader2 className="animate-spin" /> : <Camera />} {busy === "scan" ? "Reading scores…" : image ? "Replace official result screenshot" : "📷 Upload official result screenshot"}
          </Button>
          {fixtures && (
            <div className="space-y-2">
              {image && <img src={image} alt="Official result screenshot" className="max-h-56 w-full rounded-md border border-border bg-field object-contain" />}
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Verify & amend scores</p>
              {fixtures.map((f, i) => (
                <div key={f.matchId} className="grid grid-cols-[1fr_3rem_auto_3rem_1fr] items-center gap-1.5 text-[11px] font-bold">
                  <span className="truncate text-right">{f.home}</span>
                  {(["homeScore", "awayScore"] as const).map((k, idx) => (
                    <Input key={k} type="number" min={0} inputMode="numeric" aria-label={`${idx ? f.away : f.home} goals`} value={f[k] ?? ""} onChange={(e) => { const v = e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))); setFixtures((fs) => fs && fs.map((x, j) => (j === i ? { ...x, [k]: v } : x))); }} className={`h-9 bg-field px-1 text-center text-sm ${f[k] == null ? "border-warning" : ""} ${idx ? "order-4" : "order-2"}`} />
                  ))}
                  <span className="order-3 text-muted-foreground">-</span>
                  <span className="order-5 truncate">{f.away}</span>
                </div>
              ))}
              <Button disabled={incomplete || busy === "publish"} onClick={publish} className="h-12 w-full text-xs font-black uppercase">{busy === "publish" && <Loader2 className="animate-spin" />} Confirm & publish results</Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
