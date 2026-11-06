# Gadwalak (جدولك)

Gadwalak helps Ain Shams University students find their exam schedules. The application is a unified, full-stack **Next.js** platform (App Router, React 19, TypeScript, Tailwind CSS) powered directly by SQLite.

## Features

- **Multi-Mode Search**: Search by Student Seat Number, browse by Department & Academic Level, or lookup individual Course Codes.
- **Bilingual & RTL**: Full Arabic (عربي) and English support with native right-to-left layout and live language switching.
- **Admin Ingestion Portal (`/admin`)**: Upload Excel (`.xlsx`) or CSV spreadsheets to automatically update students, courses, exam schedules, and hall allocations.
- **Template Generator**: One-click download of a pre-formatted schedule spreadsheet template (`gadwalak-schedule-template.csv`).
- **Calendar Integration**: One-click Google Calendar sync and downloadable `.ics` iCalendar file for Apple Calendar and Outlook.
- **Real-Time Urgency & Status**: Exam countdown badges (*"Today!"*, *"Tomorrow"*, *"In 3 days"*, *"Completed"*).
- **Dual Presentation**: Chronological List View and interactive Month Calendar View.
- **Recent Searches**: One-tap quick access for saved seat numbers.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Student portal
│   │   ├── admin/page.tsx              # Admin spreadsheet upload dashboard
│   │   ├── api/
│   │   │   ├── get/[studentId]/route.ts# Student schedule lookup
│   │   │   ├── departments/route.ts    # Department list
│   │   │   ├── courses/route.ts        # Course catalog
│   │   │   ├── schedule/
│   │   │   │   ├── department/[dept]/[level]/route.ts
│   │   │   │   └── course/[code]/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── import/route.ts     # Upload & parse CSV/Excel directly into SQLite
│   │   │   │   ├── template/route.ts   # Download sample template
│   │   │   │   └── stats/route.ts      # Database stats
│   │   │   └── health/route.ts         # Health check endpoint
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/                     # Modular React UI components
│   └── lib/                            # Database (better-sqlite3), importer, types, i18n
├── scripts/
│   ├── seed.ts                         # `npm run seed`: Generate sample database
│   └── import.ts                       # `npm run import`: CLI spreadsheet importer
├── data/
│   └── scheduler.db                    # SQLite database file
├── tests/
│   └── api.test.ts                     # Automated test suite
├── Dockerfile                          # Unified Next.js container
├── docker-compose.yml                  # Single-service container setup
├── package.json
└── next.config.ts
```

## Quick Start (Local Development)

### 1. Install Dependencies & Seed Database

```bash
npm install
npm run seed
```

This creates `data/scheduler.db` populated with sample Ain Shams University students, courses, exam times, and hall locations.

### 2. Start the Application

```bash
npm run dev
```

Open <http://localhost:3000> in your browser:
- **Student Portal**: <http://localhost:3000> (Try seat number `2023170461`, browse `Computer Science Level 3`, or search `CS301`).
- **Admin Ingestion Portal**: <http://localhost:3000/admin> (Default password: `admin123`).

## Ingesting & Updating Data

You can add and update student schedules in two ways:

### Method 1: Web Admin Upload (`/admin`)
1. Navigate to <http://localhost:3000/admin> and enter the admin password (default: `admin123`, or set via `ADMIN_PASSWORD`).
2. Click **Download CSV Template** to get the sample spreadsheet with the correct column headers.
3. Fill in your university data, then drag and drop the Excel (`.xlsx`) or `.csv` file.
4. Click **Import into Database**. The importer automatically maps students, courses, exam sessions, and room assignments.

### Method 2: Command Line Importer (`npm run import`)
To import directly from the terminal:

```bash
npm run import -- path/to/my_schedule.xlsx
# or
npm run import -- path/to/my_schedule.csv
```

## Run with Docker Compose

```bash
docker compose up --build
```

Access the application at <http://localhost:3000>.

For live code auto-reload during development:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Running Tests

```bash
npm test
```

Build verification:

```bash
npm run build
```
