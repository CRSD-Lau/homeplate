# Changelog

## v0.1.1 - 2026-09-06

Release snapshot of the household tracker improvements since v0.1.0. This release includes the previously unreleased Phase 2A features and database migrations as well as maintenance fixes.

### Added and improved

- Faster food search with aliases, favourites, serving conversions and meal-copy helpers.
- Saved-meal favourites and expanded meal categories for daily logging.
- Mobile tracking layouts, step logging, goal-weight settings and profile pictures.
- More reliable session persistence over plain-HTTP local-network connections and consistent theme controls.

### Maintenance

- Update vulnerable runtime and development dependencies while retaining Next.js 16.2 and the existing Node.js application architecture.
- Align the package version and release documentation with this source snapshot.

### Upgrade notes

- Back up the household database before upgrading, then run `pnpm db:migrate` with an explicit `DATABASE_URL` for the intended instance.
- Migration 0001 adds step tracking and goal weight, expands meal categories, and maps existing `snack` food logs and saved meals to `afternoon_snack` without changing their nutrition snapshots.
- Migration 0002 enables PostgreSQL `pg_trgm`, adds food aliases/favourites and search indexes, and adds a saved-meal favourite flag. The database role must be able to install the extension.
- Seeding is for initial setup; running `pnpm db:seed` on an existing instance resets the configured accounts' password hashes. It is not an upgrade step.
- CNF/Open Food Facts ingestion, barcode scanning, OCR and export/backup UI remain outside this release.

## v0.1.0 - Phase 1 MVP

Initial private household tracker release for Neil and Allison.

- Private seeded login with persistent sessions
- Mobile-first PWA foundation
- User profiles, independent unit preferences, height, starting weight, and BMI
- Manual foods and daily food logging with nutrition snapshots
- Weight, water, exercise, blood pressure, and blood glucose logging
- Dashboard, quick-log links, and basic trend charts
- Neil-only admin route foundation
- PostgreSQL, Drizzle ORM, Docker Compose, seed scripts, and tests
- Server-backed light/dark theme toggle for reliable Android/iOS behavior

Deferred until after the `v0.1.1` UI/design pass:

- CNF import
- Open Food Facts
- Barcode scanning
- OCR
- Recipes and saved meals
- Recent/favourite foods
- Copy yesterday
- Export/backup files
