# UI Polish Pass — Phase 1

**Date:** 2026-05-07  
**Scope:** Option A — targeted consistency fixes across all screens including admin/export  
**Goal:** Make the app feel finished and cohesive without redesigning anything.

---

## Context

HomePlate is a Next.js 16 App Router app using Tailwind CSS v4 with a custom brand token system (`--brand-*` CSS variables) and a set of global component classes (`.hp-card`, `.hp-card-lg`, `.field`, `.primary-button`, `.secondary-button`, `.icon-button`, `.hp-icon-chip`, `.hp-display`). The main app screens are already cohesive. Several secondary surfaces were built at different times and still use raw Tailwind colors (`slate-*`, `emerald-*`, `red-*`) instead of brand tokens.

---

## Changes

### 1. Login page (`src/app/login/page.tsx`)

**Problem:** Uses `slate-950`, `slate-200`, `slate-800`, `slate-900`, `emerald-700`, `slate-600`, `slate-400`, `slate-500`, raw background `#f7faf8`, and `rounded-lg` card — completely outside the brand token system.

**Fix:** Replace with brand tokens throughout. Card becomes `hp-card-lg` style (brand tokens, `rounded-[1.5rem]`). Background becomes `bg-[var(--background)]`. Icon chip becomes `.hp-icon-chip bg-[var(--brand-teal)]`. Labels use `text-[var(--brand-ink)]`/`text-[var(--brand-muted)]`. Field uses the `.field` class (already applied). Error message aligned to FormMessage pattern with brand tokens. Login button already uses `.primary-button`.

### 2. FormMessage component (`src/components/form-message.tsx`)

**Problem:** Uses raw Tailwind semantic colors (`red-50`, `red-200`, `red-700`, `emerald-50`, `emerald-200`, `emerald-800`, and dark variants) instead of brand tokens.

**Fix:** Replace with brand-token equivalents. Error state: `bg-[var(--brand-coral)]/10 border-[var(--brand-coral)]/30 text-[var(--brand-coral)]`. Success state: `bg-[var(--brand-green)]/10 border-[var(--brand-green)]/30 text-[var(--brand-green)]`. Remove dark-mode conditional classes (brand tokens already handle dark mode).

### 3. Add Food page — "Phase 3" label (`src/app/(app)/log/[mealType]/add/page.tsx`)

**Problem:** Disabled "Scan meal" and "Describe meal" buttons show `<span>Phase 3</span>` — internal project terminology exposed to users.

**Fix:** Change sub-label text from "Phase 3" to "Coming soon".

### 4. Water page — duplicate heading (`src/app/(app)/water/page.tsx`)

**Problem:** `TrackingPageShell` already renders the page title "Hydration" in the header. The card inside also has `<h2 className="hp-display text-4xl">Hydration</h2>`, creating a repeated heading.

**Fix:** Remove the redundant inner `h2`. The glass count and progress bar are sufficient content for the card header area.

### 5. Add Food page — empty results state (`src/app/(app)/log/[mealType]/add/page.tsx`)

**Problem:** When no foods match a search, a raw `<p className="text-sm font-medium text-[var(--brand-muted)]">No foods match your search.</p>` is used instead of the `EmptyState` component.

**Fix:** Replace with `<EmptyState title="No foods match your search." description="Try a different term or add a manual food in Foods." />`.

### 6. Admin page (`src/app/(app)/admin/page.tsx`)

**Problem:** Inline `text-slate-600`, `text-slate-500`, `rounded-lg border border-slate-200` raw styles inside panel content areas.

**Fix:** Replace with brand tokens: `text-[var(--brand-muted)]`, `rounded-2xl border border-[var(--brand-line)]`.

### 7. Export page (`src/app/(app)/export/page.tsx`)

**Problem:** `text-slate-600` inline style in the placeholder description.

**Fix:** Replace with `text-[var(--brand-muted)]`.

### 8. `page-header.tsx` — Panel and StatCard (`src/components/page-header.tsx`)

**Problem:** `Panel` component uses `text-lg font-extrabold` for section titles (fine) but `StatCard` has no issues. The inner content of `Panel` when used in admin/export uses `slate-*` styles (those are in the call sites, not the component itself — fixed in items 6/7 above).

**Fix:** No changes needed to `page-header.tsx` itself — the slate colors are at the call sites.

---

## Out of Scope

- Navigation structure, routing, layout
- Core business logic, calculations, auth, DB
- Redesigning any screen
- Removing unused files (`app-shell.tsx`, `nav.tsx`) — no visible polish benefit
- Semantic heading level changes (`SectionHeading` h1→h2)
- Extracting shared tab components

---

## Verification

After changes: run `pnpm lint`, `pnpm typecheck`, `pnpm build`. Fix any issues introduced.
