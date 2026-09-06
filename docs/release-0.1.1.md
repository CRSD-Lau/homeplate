---
author: Neil Mitchell
creator: Neil Mitchell
last_modified_by: Neil Mitchell
date: 2026-09-06
---

# HomePlate 0.1.1 release validation

This source release packages the implemented household tracking and Phase 2A food improvements since 0.1.0, together with dependency security maintenance. The release includes both feature and database changes documented in CHANGELOG.md.

## Dependency maintenance

Next.js and eslint-config-next stay on the 16.2 line at 16.2.12. Narrow pnpm overrides select patched Sharp, PostCSS, brace-expansion, js-yaml, nanoid and Vite dependencies while retaining the application architecture. Sharp 0.35.4 is the one pre-1.0 minor dependency step required for its patched native image-processing chain; its Node requirement is compatible with the tested Node 24 runtime.

The production dependency audit reports zero vulnerabilities. The full audit reports no high or critical findings, with one moderate and one low finding remaining in development-only esbuild dependencies under the legacy Drizzle loader and tsx. Those dependency lines are retained to avoid forcing an unrelated loader/toolchain upgrade. The application does not call esbuild's development-server or served-directory APIs.

## Checks performed

- Dependency installation and final frozen-lockfile consistency check on Node 24.11.0 and pnpm 10.33.3.
- ESLint, TypeScript, all 53 tests in 14 files, and the optimized Next.js production build passed.
- Next-resolved Sharp resized and converted an image; argon2 password hashing and verification passed.
- Fresh migrations and synthetic account/food seeding passed in a separate PostgreSQL 16 container.
- Upgrade from the actual v0.1.0 migration passed with synthetic legacy records. Existing food and saved-meal snack categories became afternoon_snack; quantity 2 and calorie snapshot 123.5 were preserved. All three migrations, step/favourite tables and pg_trgm were present. Repeating the migrate command was safe.
- Production-mode HTTP browser checks passed at 1280px and 390px: unauthenticated redirect, login, HttpOnly/SameSite session persistence across reload, water entry and reload, food search, member/admin route isolation, and no horizontal overflow on the checked water page.
- A mobile food flow saved 1.5 banana servings with a 157.5-calorie snapshot, confirmed the stored values, and retained the favourite after reload.
- Reviewed screenshots and browser page-error checks passed. These were headless Edge viewport checks, not a physical-phone install or service-worker offline acceptance test.
- Full Git history secret scan found no leaks. Final staged changes were also checked before publication.

All database and browser writes used synthetic accounts and a disposable database. The existing household database, installed application and live local services were not changed. This GitHub source release does not deploy the application or run household migrations automatically.

## Upgrade requirements

Follow README.md and CHANGELOG.md: back up the intended instance, set DATABASE_URL explicitly, install locked dependencies, run migrations, build and start. pg_trgm installation must be permitted. Do not reset the database or rerun the account seed as an upgrade step, because seeding changes passwords.
