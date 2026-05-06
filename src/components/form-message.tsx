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
      <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </p>
    );
  }

  if (saved) {
    return (
      <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
        {savedText}
      </p>
    );
  }

  return null;
}
