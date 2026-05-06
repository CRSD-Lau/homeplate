export type WeightUnit = "lb" | "kg";
export type HeightUnit = "cm" | "ft_in";
export type WaterUnit = "ml" | "oz" | "cups";
export type BloodGlucoseUnit = "mmol_l" | "mg_dl";

export const KG_PER_LB = 0.45359237;
export const ML_PER_US_FL_OZ = 29.5735295625;
export const ML_PER_CANADIAN_CUP = 250;
export const GLUCOSE_MG_DL_PER_MMOL_L = 18.0182;

export function lbToKg(lb: number) {
  return lb * KG_PER_LB;
}

export function kgToLb(kg: number) {
  return kg / KG_PER_LB;
}

export function ftInToCm(feet: number, inches: number) {
  return (feet * 12 + inches) * 2.54;
}

export function cmToFtIn(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;

  return { feet, inches };
}

export function normalizeWeightToKg(value: number, unit: WeightUnit) {
  return unit === "lb" ? lbToKg(value) : value;
}

export function normalizeHeightToCm(
  value: number,
  unit: HeightUnit,
  inches = 0,
) {
  return unit === "ft_in" ? ftInToCm(value, inches) : value;
}

export function mlToOz(ml: number) {
  return ml / ML_PER_US_FL_OZ;
}

export function ozToMl(oz: number) {
  return oz * ML_PER_US_FL_OZ;
}

export function cupsToMl(cups: number) {
  return cups * ML_PER_CANADIAN_CUP;
}

export function normalizeWaterToMl(value: number, unit: WaterUnit) {
  if (unit === "oz") return ozToMl(value);
  if (unit === "cups") return cupsToMl(value);
  return value;
}

export function mmolLToMgDl(value: number) {
  return value * GLUCOSE_MG_DL_PER_MMOL_L;
}

export function mgDlToMmolL(value: number) {
  return value / GLUCOSE_MG_DL_PER_MMOL_L;
}

export function normalizeGlucoseToMmolL(
  value: number,
  unit: BloodGlucoseUnit,
) {
  return unit === "mg_dl" ? mgDlToMmolL(value) : value;
}

export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-CA", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatWeight(kg: number, unit: WeightUnit) {
  return unit === "lb"
    ? `${formatNumber(kgToLb(kg), 1)} lb`
    : `${formatNumber(kg, 1)} kg`;
}

export function formatHeight(cm: number, unit: HeightUnit) {
  if (unit === "ft_in") {
    const { feet, inches } = cmToFtIn(cm);
    return `${feet} ft ${formatNumber(inches, 1)} in`;
  }

  return `${formatNumber(cm, 1)} cm`;
}

export function formatWater(ml: number, unit: WaterUnit) {
  if (unit === "oz") return `${formatNumber(mlToOz(ml), 1)} oz`;
  if (unit === "cups") {
    return `${formatNumber(ml / ML_PER_CANADIAN_CUP, 1)} cups`;
  }
  return `${formatNumber(ml, 0)} ml`;
}

export function formatGlucose(mmolL: number, unit: BloodGlucoseUnit) {
  return unit === "mg_dl"
    ? `${formatNumber(mmolLToMgDl(mmolL), 0)} mg/dL`
    : `${formatNumber(mmolL, 1)} mmol/L`;
}
