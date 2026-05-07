import { describe, expect, it } from "vitest";

import { parseDashboardPreferences } from "./dashboard-preferences";

describe("parseDashboardPreferences", () => {
  it("returns null targets when preferences are missing", () => {
    expect(parseDashboardPreferences(null)).toEqual({
      calorieTarget: null,
      macroTargets: {
        proteinG: null,
        carbsG: null,
        fatG: null,
      },
    });
  });

  it("accepts positive numeric calorie and macro targets", () => {
    expect(
      parseDashboardPreferences({
        calorieTarget: 2100,
        macroTargets: {
          proteinG: 131,
          carbsG: 235,
          fatG: 70,
        },
      }),
    ).toEqual({
      calorieTarget: 2100,
      macroTargets: {
        proteinG: 131,
        carbsG: 235,
        fatG: 70,
      },
    });
  });

  it("ignores invalid, zero, or negative targets", () => {
    expect(
      parseDashboardPreferences({
        calorieTarget: -1,
        macroTargets: {
          proteinG: 0,
          carbsG: "235",
          fatG: Number.NaN,
        },
      }),
    ).toEqual({
      calorieTarget: null,
      macroTargets: {
        proteinG: null,
        carbsG: null,
        fatG: null,
      },
    });
  });
});
