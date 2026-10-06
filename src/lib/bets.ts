import type { Market } from "./odds";

export type LegResult = "won" | "lost";
export type Leg = { matchId: string; home: string; away: string; time: string; market: Market; key: string; label: string; odds: number; result?: LegResult; score?: string };
export type BetStatus = "PENDING" | "WON" | "LOST";
export type Bet = { id: string; placedAt: number; legs: Leg[]; totalOdds: number; stake: number; payout: number; status: BetStatus; settledAt?: number };
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

const norm = (s: string) => s.toLowerCase().replace(/\b(fc|cf|afc|sc)\b/g, "").replace(/[^a-z0-9]/g, "");
export const sameTeam = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};

export function settleBet(bet: Bet, scores: ScoreLine[], now = Date.now()): { bet: Bet } | { error: string } {
  const legs: Leg[] = [];
  for (const leg of bet.legs) {
    const s = scores.find((r) => sameTeam(r.home, leg.home) && sameTeam(r.away, leg.away));
    if (!s) return { error: MISMATCH_ERROR };
    legs.push({ ...leg, score: `${s.homeScore}-${s.awayScore}`, result: legWins(leg.key, s.homeScore, s.awayScore) ? "won" : "lost" });
  }
  return { bet: { ...bet, legs, status: legs.every((l) => l.result === "won") ? "WON" : "LOST", settledAt: now } };
}
