import { describe, expect, it } from "vitest";

import { normalizeThemePreference } from "./theme";

describe("normalizeThemePreference", () => {
  it("preserves explicit light and dark preferences", () => {
    expect(normalizeThemePreference("light")).toBe("light");
    expect(normalizeThemePreference("dark")).toBe("dark");
  });

  it("defaults missing, old system, or unknown values to light", () => {
    expect(normalizeThemePreference(undefined)).toBe("light");
    expect(normalizeThemePreference(null)).toBe("light");
    expect(normalizeThemePreference("system")).toBe("light");
    expect(normalizeThemePreference("sepia")).toBe("light");
  });
});
