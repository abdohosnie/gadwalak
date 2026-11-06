# Repository Guidelines

## Project Structure & Module Organization

Gadwalak helps Ain Shams University students find their exam schedules. The application is a unified full-stack Next.js project powered by SQLite:

- `src/app/` — Next.js 16 App Router pages (`page.tsx`, `admin/page.tsx`, `layout.tsx`, `globals.css`).
- `src/app/api/` — Native Next.js API Route Handlers (`get/[studentId]`, `departments`, `courses`, `schedule`, `admin/import`, `admin/stats`, `admin/template`, `health`).
- `src/components/` — Reusable React UI components (`Navbar.tsx`, `SearchTabs.tsx`, `ExamCard.tsx`, `ScheduleView.tsx`, `CalendarMonthView.tsx`, `AdminUploader.tsx`).
- `src/lib/` — Database (`db.ts` with better-sqlite3), spreadsheet parser (`importer.ts`), types (`types.ts`), i18n (`i18n.ts`), and calendar utilities (`calendar.ts`).
- `scripts/` — CLI utilities: `seed.ts` (sample data generator) and `import.ts` (spreadsheet importer).
- `data/` — SQLite database file (`scheduler.db`).
- `tests/` — Automated test suite (`api.test.ts`).

## Build, Test, and Development Commands

- Install dependencies:
  ```bash
  npm install
  ```
- Seed database with realistic sample ASU data:
  ```bash
  npm run seed
  ```
- Start local development server (with live reload):
  ```bash
  npm run dev
  ```
- Run automated tests:
  ```bash
  npm test
  ```
- Build production bundle:
  ```bash
  npm run build
  ```
- Import spreadsheet from CLI:
  ```bash
  npm run import -- path/to/file.xlsx
  ```

## Docker Commands

Run the full stack in Docker:

```bash
docker compose up --build
```

Access the app at <http://localhost:3000>.

## Coding Style & Naming Conventions

- TypeScript everywhere. Use PascalCase for React components and camelCase for functions and variables.
- Keep components modular and accessible (ARIA attributes, semantic HTML, RTL support).
- Database operations belong in `src/lib/db.ts` or `src/lib/importer.ts`.
