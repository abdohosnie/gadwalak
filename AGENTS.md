# Repository Guidelines

## Project Structure & Module Organization

Gadwalak helps Ain Shams University students find their exam schedules. The
frontend is plain HTML, CSS, and JavaScript, with no package manager or build
step. Keep the page entry point in `nginx/frontend/index.html`, stylesheets in
`nginx/frontend/css/`, browser scripts in `nginx/frontend/js/`, and tests in
`nginx/frontend/tests/`. Nginx configuration and its Dockerfile belong in
`nginx/`. Keep backend application code in `backend/app/`, configuration in
`backend/app/config.py`, and dependencies in `backend/requirements.txt`.
Compose service definitions live in `docker-compose.yml`; optional local
development overrides live in `docker-compose.dev.yml`. The backend reads
`data/scheduler.db` through the mounted `/srv/data` directory. Database files
and populated `.env` files must not be committed.

## Build, Test, and Development Commands

Run the full stack from the repository root:

```bash
docker compose up --build
```

To enable Uvicorn reload and mount backend source during development, include
the dev file explicitly:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The frontend has no build step. Its JavaScript tests use Node's built-in test
runner:

```bash
node --test nginx/frontend/tests/*.test.mjs
```

For direct backend development, install `backend/requirements.txt` in a
virtual environment and run `uvicorn app.main:app --reload` from `backend/`.
Provide `data/scheduler.db` before testing schedule lookups.

## Coding Style & Naming Conventions

Use semantic HTML, two-space indentation, lowercase kebab-case filenames, and
descriptive CSS class names. Keep JavaScript in plain browser modules and use
camelCase for functions and variables. Use Python's four-space indentation,
`snake_case` functions and variables, and PascalCase classes in the backend.
Add type annotations for new public Python helpers and keep configuration
keys aligned with the `EXAM_` variables in `.env.example`.

## Testing Guidelines

For frontend behavior changes, run the Node tests and check the relevant
interactions through Nginx. For backend changes, run a focused import or
compile check, such as `python3 -m py_compile app/config.py` from `backend/`.
When Compose or Nginx files change, check the resolved configuration with
`docker compose config` and verify the image build paths.

## Commit & Pull Request Guidelines

Use concise imperative commit subjects, such as `Add exam schedule lookup`.
Keep each commit focused. Pull requests should explain the user-visible
change, list validation steps, link the related issue when present, and include
screenshots for frontend visual changes.
