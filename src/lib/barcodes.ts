const barcodeLengths = new Set([8, 12, 13, 14]);

export function normalizeBarcode(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function isPlausibleBarcode(value: string | null | undefined) {
  const barcode = normalizeBarcode(value);
  return barcode !== null && barcodeLengths.has(barcode.length);
}

export function getBarcodeLookupKeys(value: string | null | undefined) {
  const barcode = normalizeBarcode(value);
  if (barcode === null) return [];

  const keys = [barcode];
  if (barcode.length === 12) {
    keys.push(`0${barcode}`);
  } else if (barcode.length === 13 && barcode.startsWith("0")) {
    keys.push(barcode.slice(1));
  }

  return Array.from(new Set(keys));
}
