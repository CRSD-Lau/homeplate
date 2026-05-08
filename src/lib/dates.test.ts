import { describe, expect, it } from "vitest";

import { normalizeDateInputValue, recentDateKeys } from "./dates";

describe("date grouping", () => {
  it("returns stable yyyy-mm-dd keys for recent ranges", () => {
    expect(recentDateKeys(3, new Date("2026-05-06T12:00:00-03:00"))).toEqual([
      "2026-05-04",
      "2026-05-05",
      "2026-05-06",
    ]);
  });

  it("clamps normalized date values to a provided latest date", () => {
    expect(normalizeDateInputValue("2026-05-08", "2026-05-07")).toBe(
      "2026-05-07",
    );
    expect(normalizeDateInputValue("2026-05-06", "2026-05-07")).toBe(
      "2026-05-06",
    );
  });
});
