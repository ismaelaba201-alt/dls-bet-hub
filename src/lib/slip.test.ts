import { describe, expect, it } from "vitest";
import { generateOdds } from "./odds";
import { isLocked, payout, slipLines, stakeError, togglePick, totalOdds } from "./slip";

const m = generateOdds({ home: "Real Madrid", away: "Chelsea", time: "" }, "m1");
const sel = (k: string) => m.selections.find((s) => s.key === k)!;

describe("bet slip rules", () => {
  it("picking a 1X2 outcome locks Double Chance", () => {
    const slip = togglePick({}, "m1", sel("1"));
    expect(isLocked(slip["m1"], sel("1X"))).toBe(true);
    expect(togglePick(slip, "m1", sel("12"))).toBe(slip);
  });
  it("picking Double Chance locks 1X2", () => {
    const slip = togglePick({}, "m1", sel("X2"));
    expect(isLocked(slip["m1"], sel("2"))).toBe(true);
  });
  it("allows only one Over/Under pick", () => {
    const slip = togglePick({}, "m1", sel("O2.5"));
    expect(isLocked(slip["m1"], sel("U3.5"))).toBe(true);
  });
  it("allows one result pick plus one goal pick (max 2)", () => {
    const slip = togglePick(togglePick({}, "m1", sel("1")), "m1", sel("U4.5"));
    expect(slipLines(slip, [m])).toHaveLength(2);
  });
  it("tapping a selected option deselects and unlocks", () => {
    const slip = togglePick(togglePick({}, "m1", sel("1")), "m1", sel("1"));
    expect(slip["m1"]).toBeUndefined();
    expect(isLocked(slip["m1"], sel("1X"))).toBe(false);
  });
  it("enforces stake ₦10–₦50", () => {
    expect(stakeError(9)).not.toBeNull();
    expect(stakeError(51)).not.toBeNull();
    expect(stakeError(10)).toBeNull();
    expect(stakeError(50)).toBeNull();
  });
  it("multiplies odds and computes payout", () => {
    expect(totalOdds([1.2, 1.5])).toBe(1.8);
    expect(payout(1.8, 50)).toBe(90);
  });
});

import { slipFromLegs } from "./slip";
describe("slipFromLegs", () => {
  it("rebuilds the exact shared picks", () => {
    const m = generateOdds({ home: "Arsenal", away: "Chelsea", time: "" }, "m1");
    const slip = slipFromLegs([{ matchId: "m1", key: "1X" }, { matchId: "m1", key: "U3.5" }], [m]);
    expect(slip).toEqual({ m1: { result: "1X", goals: "U3.5" } });
  });
});
