import type { Market } from "./odds";

export type LegResult = "won" | "lost";
export type Leg = { matchId: string; home: string; away: string; time: string; market: Market; key: string; label: string; odds: number; result?: LegResult; score?: string };
export type BetStatus = "PENDING" | "WON" | "LOST";
export type Bet = { id: string; placedAt: number; legs: Leg[]; totalOdds: number; stake: number; payout: number; status: BetStatus; settledAt?: number; gameCode?: string; betCode?: string; resultImage?: string };
export type ScoreLine = { home: string; away: string; homeScore: number; awayScore: number };

export const MISMATCH_ERROR = "Uploaded screenshot does not match the fixtures on this bet ticket.";

export function legWins(key: string, h: number, a: number): boolean {
  const goals = h + a;
  switch (key) {
    case "1": return h > a;
    case "X": return h === a;
    case "2": return a > h;
    case "1X": return h >= a;
    case "X2": return a >= h;
    case "12": return h !== a;
  }
  const m = /^([OU])(\d+(?:\.\d+)?)$/.exec(key);
  if (m) return m[1] === "O" ? goals > Number(m[2]) : goals < Number(m[2]);
  return false;
}

export const SIMILARITY_THRESHOLD = 0.8;

// Lowercase, strip accents, scores, numbers, hyphens, "v"/"vs" separators and club suffixes.
export function normalizeTeam(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0-9]+/g, " ")
    .replace(/[-–—:|_.,()]/g, " ")
    .replace(/\b(v|vs|fc|cf|afc|sc|ac|club)\b/g, " ")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}

export function similarity(a: string, b: string): number {
  const x = normalizeTeam(a).replace(/ /g, ""), y = normalizeTeam(b).replace(/ /g, "");
  if (!x || !y) return 0;
  if (x === y || ((x.includes(y) || y.includes(x)) && Math.min(x.length, y.length) >= 4)) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

export const sameTeam = (a: string, b: string) => similarity(a, b) >= SIMILARITY_THRESHOLD;

// Parse a raw OCR line like "MANCHESTER CITY 1 - 2 FC BARCELONA".
export function parseScoreLine(raw: string): ScoreLine | null {
  const m = /^\s*(.*?[a-zA-Z\u00C0-\u024F].*?)\s+(\d{1,2})\s*(?:[-–—:]|\bv\b|\bvs\b)?\s*(\d{1,2})\s+(.*?[a-zA-Z\u00C0-\u024F].*?)\s*$/.exec(raw);
  if (!m) return null;
  return { home: m[1]!.trim(), away: m[4]!.trim(), homeScore: Number(m[2]), awayScore: Number(m[3]) };
}

// Turn OCR rows (structured or raw text) into clean score lines.
export function cleanScores(rows: Array<Partial<ScoreLine> & { raw?: string }>): ScoreLine[] {
  return rows.flatMap((r) => {
    const valid = r.home && r.away && Number.isInteger(r.homeScore) && Number.isInteger(r.awayScore);
    if (valid && !/\d/.test(r.home! + r.away!)) return [r as ScoreLine];
    const parsed = parseScoreLine(r.raw || `${r.home ?? ""} ${r.homeScore ?? ""} - ${r.awayScore ?? ""} ${r.away ?? ""}`);
    return parsed ? [parsed] : valid ? [r as ScoreLine] : [];
  });
}

export type FixtureScore = { matchId: string; home: string; away: string; homeScore: number | null; awayScore: number | null };

export function fixturesOf(bet: Bet) {
  const seen = new Map<string, Leg>();
  for (const l of bet.legs) if (!seen.has(l.matchId)) seen.set(l.matchId, l);
  return [...seen.values()];
}

// Match OCR scores to each fixture on the ticket. `complete` is false when any fixture failed fuzzy validation.
export function matchScores(bet: Bet, scores: ScoreLine[]): { fixtures: FixtureScore[]; complete: boolean } {
  const fixtures = fixturesOf(bet).map((f) => {
    const s = scores.find((r) => sameTeam(r.home, f.home) && sameTeam(r.away, f.away));
    return { matchId: f.matchId, home: f.home, away: f.away, homeScore: s?.homeScore ?? null, awayScore: s?.awayScore ?? null };
  });
  return { fixtures, complete: fixtures.every((f) => f.homeScore != null && f.awayScore != null) };
}

export function settleWithScores(bet: Bet, fixtures: FixtureScore[], now = Date.now()): { bet: Bet } | { error: string } {
  const legs: Leg[] = [];
  for (const leg of bet.legs) {
    const f = fixtures.find((x) => x.matchId === leg.matchId);
    if (!f || f.homeScore == null || f.awayScore == null || f.homeScore < 0 || f.awayScore < 0) return { error: MISMATCH_ERROR };
    legs.push({ ...leg, score: `${f.homeScore}-${f.awayScore}`, result: legWins(leg.key, f.homeScore, f.awayScore) ? "won" : "lost" });
  }
  return { bet: { ...bet, legs, status: legs.every((l) => l.result === "won") ? "WON" : "LOST", settledAt: now } };
}

export function settleBet(bet: Bet, scores: ScoreLine[], now = Date.now()): { bet: Bet } | { error: string } {
  const { fixtures, complete } = matchScores(bet, cleanScores(scores));
  return complete ? settleWithScores(bet, fixtures, now) : { error: MISMATCH_ERROR };
}

// Match OCR scores against a plain fixture list (used for official game results).
export function matchFixtureList(list: { id: string; home: string; away: string }[], scores: ScoreLine[]): FixtureScore[] {
  return list.map((f) => {
    const s = scores.find((r) => sameTeam(r.home, f.home) && sameTeam(r.away, f.away));
    return { matchId: f.id, home: f.home, away: f.away, homeScore: s?.homeScore ?? null, awayScore: s?.awayScore ?? null };
  });
}
