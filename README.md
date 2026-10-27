# Gadwalak

Gadwalak helps Ain Shams University students find their exam schedules. The
browser UI is plain HTML, CSS, and JavaScript. Nginx serves it and proxies API
requests to the FastAPI backend.

## Project structure

- `nginx/frontend/` — static UI files; there is no frontend build step.
- `nginx/default.conf` and `nginx/Dockerfile` — static hosting and API proxy.
- `backend/` — FastAPI application and SQLite access.
- `docker-compose.yml` — backend and Nginx services.
- `docker-compose.dev.yml` — optional backend source mount and Uvicorn reload.
- `data/` — local SQLite database mounted into the backend container.

## Run with Docker Compose

Provide the SQLite database at `data/scheduler.db`. Database files are ignored
by Git and must be supplied separately in a fresh checkout. Then start the
services from the repository root:

```bash
docker compose up --build
```

Open <http://localhost:8080>. Nginx serves the UI and forwards `/api/` requests
to the backend. The backend is reachable inside the Compose network at
`backend:8000`; it is not published directly to the host.

For backend development with live source reload, explicitly include the dev
override:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The frontend is copied into the Nginx image, so rebuild after changing its
files with `docker compose build nginx` and restart the service.

## Run the backend directly

From `backend/`, create and activate a virtual environment, install the
requirements, and start Uvicorn:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API route is `GET /api/get/{student_id}`. The health endpoint is
`GET /health`.

## Frontend checks

With Node.js installed, run the browser logic tests from the repository root:

```bash
node --test nginx/frontend/tests/*.test.mjs
```
