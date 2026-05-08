export function parseAliasInput(value: string | null | undefined) {
  const aliases: string[] = [];
  const seen = new Set<string>();

  for (const alias of (value ?? "").split(/[,\n]/)) {
    const normalized = alias.trim().replace(/\s+/g, " ").toLowerCase();
    if (!normalized || seen.has(normalized)) continue;

    seen.add(normalized);
    aliases.push(normalized);
  }

  return aliases;
}
