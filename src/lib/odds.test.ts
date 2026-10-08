import { describe, expect, it } from "vitest";
import { clampOdds, fluctuateOdds, generateOdds, moveOdds, orderedSelections, selectionLabel } from "./odds";

const pairs: Array<[string, string]> = [["Man City", "Liverpool"], ["Real Madrid", "Ajax"], ["Fooville", "Bartown"], ["Sevilla", "Bayern Munich"]];

describe("odds engine", () => {
  it("keeps every selection between 1.003 and 1.500", () => {
    for (const [home, away] of pairs) {
      for (const s of generateOdds({ home, away, time: "" }, "x").selections) {
        expect(s.odds).toBeGreaterThanOrEqual(1.003);
        expect(s.odds).toBeLessThanOrEqual(1.5);
      }
    }
  });
  it("produces only the three allowed markets", () => {
    const markets = new Set(generateOdds({ home: "A", away: "B", time: "" }, "x").selections.map((s) => s.market));
    expect([...markets].sort()).toEqual(["1X2", "Double Chance", "Over/Under"]);
  });
  it("gives the stronger team 1.003-1.250 and the underdog 1.350-1.500", () => {
    const m = generateOdds({ home: "Real Madrid", away: "Ajax", time: "" }, "x");
    const get = (k: string) => m.selections.find((s) => s.key === k)!.odds;
    expect(get("1")).toBeLessThanOrEqual(1.25);
    expect(get("2")).toBeGreaterThanOrEqual(1.35);
  });
  it("clamps manual edits", () => {
    expect(clampOdds(0.5)).toBe(1.003);
    expect(clampOdds(3)).toBe(1.5);
  });
  it("displays standard 1X2 and Double Chance ordering", () => {
    const selections = generateOdds({ home: "A", away: "B", time: "" }, "x").selections;
    expect(orderedSelections(selections, "1X2").map(selectionLabel)).toEqual(["W1", "X", "W2"]);
    expect(orderedSelections(selections, "Double Chance").map(selectionLabel)).toEqual(["1X", "12", "2X"]);
  });
  it("moves odds within bounds and reports their direction", () => {
    expect(moveOdds(1.2, 0.1)).toEqual({ odds: 1.3, trend: "up" });
    expect(moveOdds(1.2, -0.1)).toEqual({ odds: 1.1, trend: "down" });
    expect(moveOdds(1.5, 0.1)).toEqual({ odds: 1.5, trend: "same" });
    expect(fluctuateOdds(1.003, () => 0)).toEqual({ odds: 1.003, trend: "same" });
  });
});
