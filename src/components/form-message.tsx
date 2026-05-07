export function FormMessage({
  error,
  saved,
  savedText = "Saved.",
}: {
  error?: string;
  saved?: string;
  savedText?: string;
}) {
  if (error) {
    return (
      <p className="mb-4 rounded-2xl border border-[var(--brand-coral)]/30 bg-[var(--brand-coral)]/10 px-3 py-2 text-sm font-bold text-[var(--brand-coral)]">
        {error}
      </p>
    );
  }

  if (saved) {
    return (
      <p className="mb-4 rounded-2xl border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-3 py-2 text-sm font-bold text-[var(--brand-green)]">
        {savedText}
      </p>
    );
  }

  return null;
}
