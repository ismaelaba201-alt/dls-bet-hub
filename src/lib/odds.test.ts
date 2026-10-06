import { describe, expect, it } from "vitest";
import { clampOdds, generateOdds } from "./odds";

const pairs = [["Man City", "Liverpool"], ["Real Madrid", "Ajax"], ["Fooville", "Bartown"], ["Sevilla", "Bayern Munich"]];

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
});
