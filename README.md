# HomePlate

HomePlate is a private household nutrition, body, and wellness tracker for Neil and Allison. It is built as an installable mobile-first PWA for day-to-day food logging, weight, water, exercise, blood pressure, blood glucose, and simple trend visibility.

This is not a public SaaS, not a commercial food database, not a subscription product, and not a medical product. It stores and visualizes private wellness data only. It does not provide diagnosis, treatment advice, or clinical interpretation.

## Current Phase

Phase 1 MVP foundation:

- Next.js App Router, TypeScript, Tailwind
- PostgreSQL with Drizzle ORM
- Docker Compose local database
- Private credentials auth
- Seeded Neil and Allison users
- Neil admin role
- User profiles and independent unit settings
- Height storage and BMI calculation
- Manual food creation
- Food logging with nutrition snapshots
- Weight, water, exercise, blood pressure, and blood glucose logs
- Mobile-first dashboard and basic trend charts
- PWA manifest and noindex robots policy
- Core unit/nutrition/BMI tests

Not implemented yet: CNF full import, Open Food Facts, barcode scanning, OCR, export files, native apps, or admin cleanup workflows.

## Required Tools

On Windows, install or confirm:

- Git
- GitHub CLI
- Node.js LTS/current
- pnpm
- Docker Desktop
- PostgreSQL client tools
- VS Code
- Codex CLI
- Optional: Vercel CLI or Railway CLI

Docker Desktop must be running before database commands can connect to local PostgreSQL.

## Local Setup

Install dependencies:

```powershell
pnpm install
```

Create `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Set these values in `.env.local`:

```env
DATABASE_URL=postgres://homeplate:homeplate_dev_password@localhost:5432/homeplate
AUTH_SECRET=
APP_BASE_URL=http://localhost:3000
SEED_NEIL_EMAIL=
SEED_NEIL_PASSWORD=
SEED_ALLISON_EMAIL=
SEED_ALLISON_PASSWORD=
ADMIN_EMAIL=
OPEN_FOOD_FACTS_USER_AGENT=HomePlate/0.1 private household app
```

Generate a local `AUTH_SECRET` in PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Use strong private passwords for `SEED_NEIL_PASSWORD` and `SEED_ALLISON_PASSWORD`. Do not commit `.env.local`.

Start PostgreSQL:

```powershell
docker compose up -d
```

Run migrations and seed Neil/Allison plus sample foods:

```powershell
pnpm db:migrate
pnpm db:seed
```

Start the dev server:

```powershell
pnpm dev --hostname 0.0.0.0
```

Open:

```text
http://localhost:3000
```

## Phone Testing

Start the dev server on all interfaces:

```powershell
pnpm dev --hostname 0.0.0.0
```

Find the Windows LAN IP:

```powershell
ipconfig
```

From Android or iPhone on the same Wi-Fi, visit:

```text
http://<windows-lan-ip>:3000
```

Android:

- Open in Chrome.
- Use Add to Home Screen or Install App when available.

iPhone:

- Open in Safari.
- Use Share, then Add to Home Screen.

Camera and barcode features are planned later and should be tested over HTTPS, such as a Vercel preview, Railway deployment, or a temporary HTTPS tunnel.

## Useful Commands

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:seed
```

Safe local DB reset requires an explicit confirmation:

```powershell
$env:CONFIRM_DB_RESET='homeplate'
pnpm db:reset
pnpm db:migrate
pnpm db:seed
```

## Data Model Notes

- Canonical metric values are stored internally for calculations.
- Originally entered values and units are preserved.
- Weight is stored canonically as kilograms.
- Height is stored canonically as centimetres.
- Water is stored canonically as millilitres.
- Blood glucose is stored canonically as mmol/L.
- Food logs store nutrition snapshots at log time, so historical logs do not change if source foods are edited later.
- Health Canada CNF and Open Food Facts are scaffolded conceptually through provenance-ready source tables, but full ingestion is not part of Phase 1.

## Privacy Notes

- No public signup.
- No analytics or third-party tracking.
- No retailer scraping.
- No public health or food log routes.
- Admin routes are Neil-only.
- Treat `.env.local`, database backups, and exported data as private wellness records.

## Roadmap

Phase 2:

- CNF import scaffold and sample mapping
- Food search improvements
- Serving conversions
- Recent foods and favourites
- Copy yesterday and copy meal
- Saved meals
- Recipes and recipe nutrition
- Better weekly/monthly stats

Phase 3:

- Open Food Facts API service
- Barcode normalization
- Browser barcode scanner
- Local barcode/product cache
- Provisional product review/save flow

Phase 4:

- OCR helper scaffold
- Nutrition Facts image upload
- EXIF stripping for stored images
- Neil-only admin cleanup tools
- Export/backup files
- Duplicate/deprecated food handling
