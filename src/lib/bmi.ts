export function calculateBmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) return null;

  const heightM = heightCm / 100;
  return weightKg / heightM ** 2;
}
