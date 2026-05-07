export function BottomActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 -mx-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent px-4 pb-2 pt-6 md:static md:mx-0 md:bg-none md:p-0">
      {children}
    </div>
  );
}
