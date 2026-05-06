import { describe, expect, it } from "vitest";

import {
  validateGlucoseEntry,
  validateHeightEntry,
  validateWaterEntry,
  validateWeightEntry,
} from "./measurements";

describe("measurement validation", () => {
  it("validates and maps weight log payloads for lb", () => {
    expect(validateWeightEntry(210, "lb")).toMatchObject({
      weightKg: expect.closeTo(95.2544, 4),
      entryWeightValue: 210,
      entryWeightUnit: "lb",
    });
  });

  it("validates and maps weight log payloads for kg", () => {
    expect(validateWeightEntry(95, "kg")).toEqual({
      weightKg: 95,
      entryWeightValue: 95,
      entryWeightUnit: "kg",
    });
  });

  it("rejects unreasonable weight values by unit", () => {
    expect(() => validateWeightEntry(12, "kg")).toThrow(
      "Weight must be between 20 and 360 kg.",
    );
    expect(() => validateWeightEntry(900, "lb")).toThrow(
      "Weight must be between 50 and 800 lb.",
    );
  });

  it("validates height in cm and ft/in", () => {
    expect(validateHeightEntry({ unit: "cm", value: 183 })).toMatchObject({
      heightCm: 183,
      heightEntryValue: 183,
      heightEntryUnit: "cm",
    });
    expect(
      validateHeightEntry({ unit: "ft_in", value: 6, inches: 0 }),
    ).toMatchObject({
      heightCm: expect.closeTo(182.88, 2),
      heightEntryValue: 6,
      heightEntryUnit: "ft_in",
    });
  });

  it("rejects unreasonable height values", () => {
    expect(() => validateHeightEntry({ unit: "cm", value: 20 })).toThrow(
      "Height must be between 50 and 260 cm.",
    );
    expect(() =>
      validateHeightEntry({ unit: "ft_in", value: 5, inches: 14 }),
    ).toThrow("Inches must be between 0 and 11 in.");
  });

  it("validates water and glucose canonical payloads", () => {
    expect(validateWaterEntry(2, "cups")).toEqual({
      amountMl: 500,
      entryAmount: 2,
      entryUnit: "cups",
    });
    expect(validateGlucoseEntry(99, "mg_dl")).toMatchObject({
      glucoseMmolL: expect.closeTo(5.49, 2),
      entryValue: 99,
      entryUnit: "mg_dl",
    });
  });
});
