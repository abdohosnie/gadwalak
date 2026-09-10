# Repository Guidelines

## Project Structure & Module Organization

Gadwalak is an exam-scheduling application with a React frontend and a Python
backend. Keep browser code in `frontend/src/`: `App.tsx` is the root component,
`main.tsx` is the entry point, and `assets/` and `public/` contain static
resources. Keep backend application code in `backend/app/`; configuration lives
in `backend/app/config.py` and dependencies in `backend/requirements.txt`.

Repository-level deployment placeholders are `docker-compose.yml`,
`frontend/Dockerfile`, `backend/Dockerfile`, and `nginx/Dockerfile`. Add service
configuration there when container support is implemented. Copy `.env.example`
for local environment settings; never commit secrets or a populated `.env`.

## Build, Test, and Development Commands

Run frontend commands from `frontend/`:

```bash
npm install       # install pinned frontend dependencies
npm run dev       # start the Vite development server
npm run build     # type-check and create a production build in dist/
npm run lint      # run ESLint on TypeScript and React files
npm run preview   # serve the production build locally
```

For the backend, create and activate a virtual environment, install
`backend/requirements.txt`, then run FastAPI with Uvicorn once an application
entry point is available, for example `uvicorn app.main:app --reload` from
`backend/`.

## Coding Style & Naming Conventions

Use TypeScript and React function components in the frontend. Follow the
existing two-space indentation, single quotes, and semicolon-free style. Use
PascalCase for components (`ExamSchedule.tsx`), camelCase for functions and
state, and descriptive CSS class names. Run `npm run lint` before sharing
frontend changes; ESLint is the configured formatter-quality gate.

Use Python's four-space indentation, `snake_case` functions and variables, and
PascalCase classes in the backend. Add type annotations for new public helpers
and keep configuration keys aligned with the `EXAM_` variables in
`.env.example`.

## Testing Guidelines

No automated test framework is configured yet. At minimum, run `npm run lint`
and `npm run build` for frontend changes. For backend changes, run a focused
import or compile check, such as `python3 -m py_compile app/config.py` from
`backend/`. When adding tests, place them beside the relevant area in a
`tests/` directory and name them `test_*.py` or `*.test.tsx`.

## Commit & Pull Request Guidelines

The repository has no commit history, so use concise imperative commit subjects,
such as `Add exam schedule form`. Keep each commit focused. Pull requests should
explain the user-visible change, list validation commands, link the related
issue when present, and include screenshots for frontend visual changes.
