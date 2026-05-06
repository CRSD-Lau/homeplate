import {
  type BloodGlucoseUnit,
  type HeightUnit,
  type WaterUnit,
  type WeightUnit,
  normalizeGlucoseToMmolL,
  normalizeHeightToCm,
  normalizeWaterToMl,
  normalizeWeightToKg,
} from "../units";

export class MeasurementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeasurementValidationError";
  }
}

export function validateWeightEntry(value: number, unit: WeightUnit) {
  assertFinite(value, "Weight");

  if (unit === "lb") {
    assertRange(value, 50, 800, "Weight", "lb");
  } else {
    assertRange(value, 20, 360, "Weight", "kg");
  }

  return {
    weightKg: normalizeWeightToKg(value, unit),
    entryWeightValue: value,
    entryWeightUnit: unit,
  };
}

export function validateHeightEntry({
  unit,
  value,
  inches = 0,
}: {
  unit: HeightUnit;
  value: number;
  inches?: number;
}) {
  assertFinite(value, "Height");

  if (unit === "cm") {
    assertRange(value, 50, 260, "Height", "cm");
    return {
      heightCm: normalizeHeightToCm(value, "cm"),
      heightEntryValue: value,
      heightEntryUnit: unit,
    };
  }

  assertRange(value, 1, 8, "Feet", "ft");
  assertFinite(inches, "Inches");
  assertRange(inches, 0, 11, "Inches", "in");

  return {
    heightCm: normalizeHeightToCm(value, "ft_in", inches),
    heightEntryValue: value,
    heightEntryUnit: unit,
  };
}

export function validateWaterEntry(value: number, unit: WaterUnit) {
  assertFinite(value, "Water");

  if (unit === "ml") {
    assertRange(value, 1, 10000, "Water", "ml");
  } else if (unit === "oz") {
    assertRange(value, 0.1, 350, "Water", "oz");
  } else {
    assertRange(value, 0.1, 40, "Water", "cups");
  }

  return {
    amountMl: normalizeWaterToMl(value, unit),
    entryAmount: value,
    entryUnit: unit,
  };
}

export function validateGlucoseEntry(value: number, unit: BloodGlucoseUnit) {
  assertFinite(value, "Blood glucose");

  if (unit === "mmol_l") {
    assertRange(value, 1, 35, "Blood glucose", "mmol/L");
  } else {
    assertRange(value, 18, 630, "Blood glucose", "mg/dL");
  }

  return {
    glucoseMmolL: normalizeGlucoseToMmolL(value, unit),
    entryValue: value,
    entryUnit: unit,
  };
}

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new MeasurementValidationError(`${label} must be a valid number.`);
  }
}

function assertRange(
  value: number,
  min: number,
  max: number,
  label: string,
  unit: string,
) {
  if (value < min || value > max) {
    throw new MeasurementValidationError(
      `${label} must be between ${min} and ${max} ${unit}.`,
    );
  }
}
