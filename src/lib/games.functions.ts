import { createServerFn } from "@tanstack/react-start";
import type { MatchOdds } from "./odds";
import type { FixtureScore, Leg } from "./bets";

export const EXPIRED = "This Matchday code has expired and betting is closed.";
const norm = (c: unknown) => String(c ?? "").trim().toUpperCase().slice(0, 40);
const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const genBetCode = () => `BC-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

export const publishGame = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; matches: MatchOdds[]; closesAt: string; featuredId: string }) => {
    if (!norm(d?.code) || !Array.isArray(d?.matches) || !d.matches.length || d.matches.length > 60) throw new Error("Invalid game");
    const t = Date.parse(d.closesAt);
    if (!Number.isFinite(t) || t <= Date.now()) throw new Error("Deadline must be in the future");
    if (!d.matches.some((m) => m.id === d.featuredId)) throw new Error("Pick a featured match");
    return { code: norm(d.code), matches: d.matches, closesAt: new Date(t).toISOString(), featuredId: d.featuredId };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { error } = await db.from("game_codes").upsert({ code: data.code, matches: data.matches as never, closes_at: data.closesAt, featured_match_id: data.featuredId });
    return { ok: !error, error: error ? "Could not publish game code." : undefined };
  });

export const loadGame = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: norm(d?.code) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("game_codes").select("code, matches, results_at, closes_at").eq("code", data.code).maybeSingle();
    if (!row) return { error: "Invalid game code." as string, matches: [] as MatchOdds[], hasResults: false };
    return { code: row.code, matches: row.matches as unknown as MatchOdds[], hasResults: !!row.results_at, closesAt: row.closes_at };
  });

export const createBetCode = createServerFn({ method: "POST" })
  .inputValidator((d: { gameCode: string; legs: Leg[] }) => {
    if (!norm(d?.gameCode) || !Array.isArray(d?.legs) || !d.legs.length || d.legs.length > 120) throw new Error("Invalid ticket");
    return { gameCode: norm(d.gameCode), legs: d.legs.map((l) => ({ matchId: String(l.matchId), key: String(l.key) })) };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: g } = await db.from("game_codes").select("closes_at").eq("code", data.gameCode).maybeSingle();
    if (!g) return { error: "Invalid game code." };
    if (g.closes_at && Date.parse(g.closes_at) <= Date.now()) return { error: EXPIRED };
    for (let i = 0; i < 6; i++) {
      const code = genBetCode();
      const { error } = await db.from("bet_codes").insert({ code, game_code: data.gameCode, legs: data.legs });
      if (!error) return { code };
      if (error.code !== "23505") return { error: "Could not create bet code." };
    }
    return { error: "Could not create bet code." };
  });

export const loadBetCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: norm(d?.code) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: bc } = await db.from("bet_codes").select("game_code, legs").eq("code", data.code).maybeSingle();
    if (!bc) return { error: "Invalid bet code." };
    const { data: g } = await db.from("game_codes").select("matches, closes_at").eq("code", bc.game_code).maybeSingle();
    if (!g) return { error: "The game for this bet code no longer exists." };
    return { closesAt: g.closes_at, gameCode: bc.game_code, legs: bc.legs as { matchId: string; key: string }[], matches: g.matches as unknown as MatchOdds[] };
  });

export const publishResults = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; fixtures: FixtureScore[]; image: string }) => {
    if (!d?.image?.startsWith("data:image/") || d.image.length > 3_000_000) throw new Error("Invalid image");
    if (!Array.isArray(d.fixtures) || d.fixtures.some((f) => !Number.isInteger(f.homeScore) || !Number.isInteger(f.awayScore) || f.homeScore! < 0 || f.awayScore! < 0)) throw new Error("All scores are required");
    return { code: norm(d.code), image: d.image, fixtures: d.fixtures.map((f) => ({ matchId: String(f.matchId), home: String(f.home), away: String(f.away), homeScore: f.homeScore, awayScore: f.awayScore })) };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db.from("game_codes").update({ results: data.fixtures, result_image: data.image, results_at: new Date().toISOString() }).eq("code", data.code).select("code").maybeSingle();
    return { ok: !!row && !error };
  });

export const getResults = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({ code: norm(d?.code) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row } = await db.from("game_codes").select("results, result_image").eq("code", data.code).maybeSingle();
    if (!row?.results) return { available: false as const };
    return { available: true as const, fixtures: row.results as unknown as FixtureScore[], image: row.result_image ?? "" };
  });

export type ActiveGame = { code: string; closesAt: string; total: number; home: string; away: string };

export const listActiveGames = createServerFn({ method: "GET" }).handler(async (): Promise<ActiveGame[]> => {
  const db = await admin();
  const { data } = await db.from("game_codes").select("code, matches, closes_at, featured_match_id").gt("closes_at", new Date().toISOString()).order("closes_at").limit(6);
  return (data ?? []).map((r) => {
    const ms = r.matches as unknown as MatchOdds[];
    const f = ms.find((m) => m.id === r.featured_match_id) ?? ms[0]!;
    return { code: r.code, closesAt: r.closes_at!, total: ms.length, home: f.home, away: f.away };
  });
});
