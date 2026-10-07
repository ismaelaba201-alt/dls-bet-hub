import { describe, expect, it } from "vitest";
import { countdown, isExpired, teamInitials } from "./teams";

describe("game code expiry", () => {
  it("is expired once the deadline has passed", () => {
    expect(isExpired("2026-10-07T12:00:00Z", Date.parse("2026-10-07T12:00:01Z"))).toBe(true);
  });
  it("is active before the deadline", () => {
    expect(isExpired("2026-10-07T12:00:00Z", Date.parse("2026-10-07T11:59:59Z"))).toBe(false);
  });
});
describe("team crests", () => {
  it("uses known abbreviations", () => { expect(teamInitials("Real Madrid")).toBe("RM"); expect(teamInitials("Chelsea")).toBe("CFC"); });
  it("formats countdown", () => { expect(countdown(3_723_000)).toBe("01:02:03"); });
});
