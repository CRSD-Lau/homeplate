import { describe, expect, it } from "vitest";

import { calculateBmi } from "./bmi";

describe("calculateBmi", () => {
  it("calculates BMI from canonical metric values", () => {
    expect(calculateBmi(95.2544, 183)).toBeCloseTo(28.44, 2);
  });

  it("returns null for invalid values", () => {
    expect(calculateBmi(0, 183)).toBeNull();
    expect(calculateBmi(95, 0)).toBeNull();
  });
});
