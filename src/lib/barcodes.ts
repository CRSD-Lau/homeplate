const barcodeLengths = new Set([8, 12, 13, 14]);

export function normalizeBarcode(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function isPlausibleBarcode(value: string | null | undefined) {
  const barcode = normalizeBarcode(value);
  return barcode !== null && barcodeLengths.has(barcode.length);
}
