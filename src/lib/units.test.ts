import { describe, expect, it } from "vitest";

import {
  cupsToMl,
  ftInToCm,
  kgToLb,
  lbToKg,
  mgDlToMmolL,
  mlToOz,
  mmolLToMgDl,
  normalizeGlucoseToMmolL,
  normalizeWaterToMl,
  normalizeWeightToKg,
  ozToMl,
} from "./units";

describe("unit conversions", () => {
  it("converts pounds and kilograms", () => {
    expect(lbToKg(210)).toBeCloseTo(95.2544, 4);
    expect(kgToLb(95.2544)).toBeCloseTo(210, 3);
    expect(normalizeWeightToKg(210, "lb")).toBeCloseTo(95.2544, 4);
    expect(normalizeWeightToKg(95, "kg")).toBe(95);
  });

  it("converts height from feet/inches to centimetres", () => {
    expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 2);
    expect(ftInToCm(5, 8)).toBeCloseTo(172.72, 2);
  });

  it("converts water units into millilitres", () => {
    expect(ozToMl(8)).toBeCloseTo(236.588, 3);
    expect(mlToOz(500)).toBeCloseTo(16.907, 3);
    expect(cupsToMl(2)).toBe(500);
    expect(normalizeWaterToMl(2, "cups")).toBe(500);
  });

  it("converts blood glucose units", () => {
    expect(mmolLToMgDl(5.5)).toBeCloseTo(99.1, 1);
    expect(mgDlToMmolL(99.1)).toBeCloseTo(5.5, 1);
    expect(normalizeGlucoseToMmolL(99.1, "mg_dl")).toBeCloseTo(5.5, 1);
  });
});
