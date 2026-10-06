import { describe, expect, it } from "vitest";
import { cleanScores, legWins, matchScores, MISMATCH_ERROR, normalizeTeam, parseScoreLine, settleBet, settleWithScores, type Bet } from "./bets";

const bet: Bet = {
  id: "B1", placedAt: 0, totalOdds: 1.5, stake: 10, payout: 15, status: "PENDING",
  legs: [
    { matchId: "m1", home: "Real Madrid", away: "Chelsea", time: "", market: "1X2", key: "1", label: "1", odds: 1.1 },
    { matchId: "m1", home: "Real Madrid", away: "Chelsea", time: "", market: "Over/Under", key: "O2.5", label: "Over 2.5", odds: 1.3 },
  ],
};

describe("settlement", () => {
  it("evaluates each market", () => {
    expect(legWins("1", 2, 1)).toBe(true);
    expect(legWins("X", 1, 1)).toBe(true);
    expect(legWins("X2", 0, 2)).toBe(true);
    expect(legWins("12", 1, 1)).toBe(false);
    expect(legWins("O2.5", 2, 1)).toBe(true);
    expect(legWins("U3.5", 2, 2)).toBe(false);
  });
  it("marks WON only when every leg wins", () => {
    const r = settleBet(bet, [{ home: "Real Madrid", away: "Chelsea FC", homeScore: 3, awayScore: 1 }]);
    expect("bet" in r && r.bet.status).toBe("WON");
  });
  it("marks LOST and flags the failed leg", () => {
    const r = settleBet(bet, [{ home: "Real Madrid", away: "Chelsea", homeScore: 1, awayScore: 0 }]);
    expect("bet" in r && r.bet.status).toBe("LOST");
    expect("bet" in r && r.bet.legs[1]!.result).toBe("lost");
  });
  it("rejects screenshots with other fixtures", () => {
    expect(settleBet(bet, [{ home: "Arsenal", away: "Spurs", homeScore: 1, awayScore: 0 }])).toEqual({ error: MISMATCH_ERROR });
  });
  it("normalizes accents, case and suffixes", () => {
    expect(normalizeTeam("Bayern Múnich")).toBe(normalizeTeam("BAYERN MUNICH"));
    expect(normalizeTeam("FC Barcelona")).toBe("barcelona");
  });
  it("extracts teams and scores from a raw line", () => {
    expect(parseScoreLine("MANCHESTER CITY 1 - 2 FC BARCELONA")).toEqual({ home: "MANCHESTER CITY", away: "FC BARCELONA", homeScore: 1, awayScore: 2 });
  });
  it("fuzzy-matches OCR typos at 80%+", () => {
    const r = settleBet(bet, cleanScores([{ raw: "REAL MADRlD 3 - 1 CHELSEA FC" }]));
    expect("bet" in r && r.bet.status).toBe("WON");
  });
  it("flags incomplete matches for manual review and settles with entered scores", () => {
    const m = matchScores(bet, [{ home: "Arsenal", away: "Spurs", homeScore: 1, awayScore: 0 }]);
    expect(m.complete).toBe(false);
    const r = settleWithScores(bet, [{ ...m.fixtures[0]!, homeScore: 4, awayScore: 1 }]);
    expect("bet" in r && r.bet.status).toBe("WON");
  });
});
