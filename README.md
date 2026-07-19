# lolstudy — LoL Predictor Survey (deployment repository)

Deployment repository for **`lol-predictor-survey`**, a university research
survey that asks League of Legends players to predict match outcomes from
partial, in-game information.

Live at **https://esportsresearch.quest**.

This repository replaces the earlier books demo that was used to validate the
droplet. The original server notes are preserved at
[`docs/original-server-notes.md`](docs/original-server-notes.md).

---

## Architecture

```
Internet → HTTPS → Nginx ┬→ /            static React build (frontend/dist)
                         └→ /api/        proxy → uvicorn 127.0.0.1:8000
                                                      ↓
                                              PostgreSQL 16 (local)
```

Frontend and backend share an origin, so the browser calls relative paths like
`/api/responses`. **There is no CORS configuration and no API base URL**, by
design.

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind 4 |
| Backend | FastAPI, SQLAlchemy 2.x, psycopg 3, Alembic |
| Database | PostgreSQL 16 (local, loopback only) |
| Serving | Nginx + Certbot/Let's Encrypt |
| Process | uvicorn inside GNU `screen` |

### Public API

Two endpoints, both participant-facing:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | liveness; touches no database |
| `POST` | `/api/responses` | submit one completed survey, get the score back |

There are no admin endpoints, no accounts, and no authentication. Outcome
import and research export are **terminal scripts only** — never HTTP routes.

---

## Repository layout

```
backend/
  app/              FastAPI application (main, models, scoring, schemas)
  alembic/          migrations — the schema's only source of truth
  scripts/          import_case_outcomes.py, export_research_data.py
  tests/            pytest suite (73 tests)
  data/             .gitkeep only; the answer key is never committed
  .env.example      template; the real .env lives only on the server
dataset/
  survey_cases.json public, label-free dataset (1200 cases)
deploy/
  nginx.conf        site config for esportsresearch.quest
  README.md         rollback-oriented deployment checklist
docs/
  original-server-notes.md   the droplet notes this repo shipped with
frontend/
  src/              React application
  public/           static assets + the synced dataset
  dist/             BUILT OUTPUT — committed on purpose (see below)
```

### Why `frontend/dist` is committed

The droplet has **458 MiB of RAM and no swap**. A Vite build there would be
OOM-killed. The build is produced locally and shipped through Git, so
deployment is `git pull` with no build step on the server.

---

## Local development

```bash
# frontend
cd frontend
npm ci
npm run dev            # syncs the dataset, serves on :5173, proxies /api

# backend
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
cp .env.example .env   # point DATABASE_URL at a local database
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8000
```

### Checks

```bash
cd frontend
npm run lint            # eslint
npm run format:check    # prettier
npm run verify          # case-selection invariants   (16 checks)
npm run verify:snapshot # public-payload leak checks   (86 checks)
npm run verify:results  # result/disclosure rules      (18 checks)
npm run build           # tsc -b && vite build

cd backend
.venv/bin/pytest        # 73 passed, 2 skipped without PostgreSQL
```

The backend suite runs on in-memory SQLite by default. Set `TEST_DATABASE_URL`
to a **staging** database to also run the `postgres_only` tests — the fixtures
truncate participant tables, so never point it at production.

---

## Deploying

See **[`deploy/README.md`](deploy/README.md)** for the full checklist with
rollback steps. Summary:

```bash
# locally: rebuild and commit dist
cd frontend && npm run build && cd ..
git add frontend/dist && git commit -m "rebuild frontend" && git push origin main

# on the droplet
cd /home/deployer/lolstudy
git pull origin main
cd backend
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000   # inside screen
```

---

## Data handling

The survey's integrity depends on participants never seeing the answer key.

| Artifact | Where it lives | In Git? |
|---|---|---|
| `dataset/survey_cases.json` | repo + served publicly | **yes** — label-free by construction |
| `backend/data/case_outcomes.json` | server only, deleted after import | **never** |
| `backend/exports/*.csv` | server only, retrieved over SSH | **never** |
| `backend/.env` | server only, mode 600 | **never** |

The public dataset carries exactly three keys per case — `case_id`,
`match_group_id`, `snapshot` — and no winner, outcome, or Riot match ID. This
is asserted by `npm run verify:snapshot` and re-checked against the built
output before every deployment commit.

Scores are disclosed only after a submission has been committed to PostgreSQL,
so a participant cannot learn an outcome by abandoning the survey, replaying a
request, or inspecting anything the browser holds.
