import { describe, expect, it } from "vitest";
import { buyTierError, formatMB, withdrawError } from "./wallet";
import { stakeError } from "./slip";

describe("wallet rules", () => {
  it("formats payouts over 1,000 MB in GB", () => {
    expect(formatMB(1250)).toBe("1.25 GB");
    expect(formatMB(1000)).toBe("1,000 MB");
    expect(formatMB(250)).toBe("250 MB");
  });
  it("official MB stake is 10–500", () => {
    expect(stakeError(9)).not.toBeNull();
    expect(stakeError(10)).toBeNull();
    expect(stakeError(500)).toBeNull();
    expect(stakeError(501)).not.toBeNull();
  });
  it("custom BC stake is 50–1000", () => {
    const bc = { min: 50, max: 1000 };
    expect(stakeError(49, bc, "BC")).not.toBeNull();
    expect(stakeError(50, bc, "BC")).toBeNull();
    expect(stakeError(1000, bc, "BC")).toBeNull();
    expect(stakeError(1001, bc, "BC")).not.toBeNull();
  });
  it("withdrawal needs 500 MB minimum", () => {
    expect(withdrawError(499, 2000)).not.toBeNull();
    expect(withdrawError(500, 2000)).toBeNull();
  });
  it("withdrawal blocks more than the balance", () => {
    expect(withdrawError(900, 800)).toBe("Insufficient Balance");
  });
  it("withdrawal keeps a 100 MB reserve unless taking the full balance", () => {
    expect(withdrawError(750, 800)).not.toBeNull();
    expect(withdrawError(700, 800)).toBeNull();
    expect(withdrawError(800, 800)).toBeNull();
  });
  it("buying BC needs enough MB", () => {
    expect(buyTierError({ id: "a", mb: 100, bc: 1000, badge: "" }, 99)).not.toBeNull();
    expect(buyTierError({ id: "a", mb: 100, bc: 1000, badge: "" }, 100)).toBeNull();
  });
});
