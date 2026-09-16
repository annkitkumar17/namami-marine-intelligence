import { describe, expect, it } from "vitest";
import { demoBanner, isFixtureMode } from "./flags";

describe("data mode flags", () => {
  it("treats FIXTURE as fixture mode", () => {
    expect(isFixtureMode("FIXTURE")).toBe(true);
    expect(isFixtureMode("REAL")).toBe(false);
  });

  it("labels demo data in the banner copy", () => {
    const banner = demoBanner("FIXTURE");
    expect(banner).toContain("FIXTURE");
    expect(banner).toContain("Not operational marine advice");
  });
});
