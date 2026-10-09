import type { MatchOdds, Selection } from "./odds";

export const STAKE_MIN = 10;
export const STAKE_MAX = 500;

export type Pick = { result?: string; goals?: string };
export type Slip = Record<string, Pick>;

// 1X2 and Double Chance share the "result" slot; Over/Under uses the "goals" slot.
const slot = (s: Selection): keyof Pick => (s.market === "Over/Under" ? "goals" : "result");

export function isLocked(pick: Pick | undefined, s: Selection): boolean {
  const current = pick?.[slot(s)];
  return current != null && current !== s.key;
}

export function isPicked(pick: Pick | undefined, s: Selection): boolean {
  return pick?.[slot(s)] === s.key;
}

export function togglePick(slip: Slip, matchId: string, s: Selection): Slip {
  const pick = { ...slip[matchId] };
  const k = slot(s);
  if (pick[k] === s.key) delete pick[k];
  else if (pick[k] != null) return slip; // locked
  else pick[k] = s.key;
  const next = { ...slip };
  if (pick.result == null && pick.goals == null) delete next[matchId];
  else next[matchId] = pick;
  return next;
}

export function slipLines(slip: Slip, matches: MatchOdds[]) {
  return matches.flatMap((m) => {
    const p = slip[m.id];
    if (!p) return [];
    return m.selections.filter((s) => s.key === p.result || s.key === p.goals).map((s) => ({ match: m, selection: s }));
  });
}

export const totalOdds = (odds: number[]) => Math.round(odds.reduce((a, b) => a * b, 1) * 1000) / 1000;

export function stakeError(stake: number, limits = { min: STAKE_MIN, max: STAKE_MAX }, unit = "MB"): string | null {
  if (!Number.isFinite(stake)) return "Enter a stake amount";
  if (stake < limits.min) return `Minimum stake is ${limits.min} ${unit}`;
  if (stake > limits.max) return `Maximum stake is ${limits.max.toLocaleString("en-US")} ${unit}`;
  return null;
}

export const payout = (odds: number, stake: number) => Math.round(odds * stake * 100) / 100;

// Rebuild a slip from shared bet-code legs, keeping only selections that still exist.
export function slipFromLegs(legs: { matchId: string; key: string }[], matches: MatchOdds[]): Slip {
  let slip: Slip = {};
  for (const l of legs) {
    const s = matches.find((m) => m.id === l.matchId)?.selections.find((x) => x.key === l.key);
    if (s) slip = togglePick(slip, l.matchId, s);
  }
  return slip;
}
