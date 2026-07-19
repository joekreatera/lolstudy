# Deployment checklist — esportsresearch.quest

Rollback-oriented. Every step that changes server state records how to undo it
**before** it is applied. Nothing here has been run yet.

Target droplet: Ubuntu 24.04 LTS, 1 vCPU, **458 MiB RAM, no swap**, 8.7 GB disk.
That RAM figure is why the frontend is **never** built on the server: `dist/` is
built locally and shipped through Git.

| | |
|---|---|
| Repo on server | `/home/deployer/lolstudy` (already cloned) |
| Domain | `esportsresearch.quest`, `www.esportsresearch.quest` |
| Static root | `/home/deployer/lolstudy/frontend/dist` |
| API | uvicorn on `127.0.0.1:8000`, behind Nginx `/api/` |
| Process model | GNU `screen`, started by hand (no systemd) |
| Database | local PostgreSQL 16 |

---

## Pre-flight — record the rollback state first

```bash
ssh lolstudy-droplet
cd /home/deployer/lolstudy

# 1. Record the current commit. This is the rollback target.
git rev-parse HEAD | tee ~/rollback-commit.txt
git status --short                      # must be clean before pulling

# 2. Note the current branch. The server is on `master`; the deployment
#    branch is `main`.
git branch --show-current

# 3. Back up the live Nginx site.
sudo cp /etc/nginx/sites-available/lolstudy \
        /etc/nginx/sites-available/lolstudy.bak.$(date +%F-%H%M)
ls -la /etc/nginx/sites-available/
```

> **Note on branches.** The server checkout is on `master` at a commit two
> behind `origin/main`. Decide explicitly whether to `git checkout main` or to
> keep `master` and merge. Do not run a bare `git pull origin main` onto
> `master` without knowing which you want.

---

## 1. Stop the demo application

The survey API uses port 8000, which the books demo currently occupies. They
cannot both run.

```bash
screen -ls                       # expect 13650.pts-0.lolstudy-main (Detached)
screen -x 13650.pts-0.lolstudy-main
# Ctrl+C   stops uvicorn
# Ctrl+A D detaches WITHOUT killing the session
```

**Rollback:** re-run the demo with `uvicorn main:app --host 0.0.0.0 --port 8000`
from the repo root at the recorded commit.

---

## 2. Pull the deployment code

```bash
cd /home/deployer/lolstudy
git fetch origin
git log --oneline HEAD..origin/main      # review before applying
git checkout main && git pull origin main
```

**Rollback:** `git checkout $(cat ~/rollback-commit.txt)`

---

## 3. Database and role

Uses a **dedicated database and a non-superuser role**. The existing demo
database is untouched.

```bash
sudo -u postgres psql
```
```sql
CREATE ROLE lol_predictor_user LOGIN PASSWORD 'GENERATE_A_STRONG_ONE';
CREATE DATABASE lol_predictor OWNER lol_predictor_user;
\c lol_predictor
GRANT USAGE, CREATE ON SCHEMA public TO lol_predictor_user;
```

Generate the password with `openssl rand -base64 32`. It goes only into `.env`.

**Rollback:** `DROP DATABASE lol_predictor; DROP ROLE lol_predictor_user;`
(safe — nothing else uses them).

---

## 4. Environment file

```bash
cd /home/deployer/lolstudy/backend
cp .env.example .env
$EDITOR .env            # set DATABASE_URL, APP_ENV=production
chmod 600 .env
ls -l .env              # expect -rw------- deployer deployer
```

`DATABASE_URL` format (psycopg 3 driver, loopback host):

```
postgresql+psycopg://lol_predictor_user:PASSWORD@127.0.0.1:5432/lol_predictor
```

`.env` is gitignored and must never be committed. Do not paste a real
`DATABASE_URL` into a shell command — it lands in `~/.bash_history`.

---

## 5. Python environment

```bash
cd /home/deployer/lolstudy/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

This is a **separate** venv from the demo's `/home/deployer/lolstudy/env`,
which is left alone. `.venv/` is gitignored.

**Rollback:** `rm -rf .venv` (affects nothing else).

---

## 6. Migrations

Alembic owns the schema; the app never calls `create_all()`.

```bash
cd /home/deployer/lolstudy/backend
.venv/bin/alembic current            # before
.venv/bin/alembic upgrade head
.venv/bin/alembic current            # expect 0001 (head)
```

**Rollback:** `.venv/bin/alembic downgrade base`

---

## 7. Import the private answer key

The artifact is **not in this repository and must never be committed**. Transfer
it over SSH only.

```bash
# from the machine that holds the artifact
scp case_outcomes.json \
    lolstudy-droplet:/home/deployer/lolstudy/backend/data/case_outcomes.json
```

```bash
cd /home/deployer/lolstudy/backend
.venv/bin/python scripts/import_case_outcomes.py --dry-run    # validate first
.venv/bin/python scripts/import_case_outcomes.py
```

Expect: **1200 cases read, 300 match groups, cutoffs per group [4], 0 conflicts,
same-winner assertion passed.**

Then delete the artifact — PostgreSQL is the only runtime source from here on:

```bash
shred -u /home/deployer/lolstudy/backend/data/case_outcomes.json
ls backend/data/            # expect only .gitkeep
```

**Rollback:** the import is one transaction; a rejected artifact leaves the
table unchanged. To undo a successful import:
`TRUNCATE survey_case_outcomes;` then re-import.

---

## 8. Start the API

`frontend/dist` is already in the repo, so there is nothing to build here.

```bash
cd /home/deployer/lolstudy/backend
screen -x 13650.pts-0.lolstudy-main      # reuse the existing session
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
# Ctrl+A D to detach
```

Bound to `127.0.0.1`, not `0.0.0.0`: only Nginx talks to it.

```bash
curl -s http://127.0.0.1:8000/api/health     # -> {"status":"ok"}
```

> The app does **not** survive a reboot, and a reboot is currently pending on
> this droplet. Re-run this step after any restart.

---

## 9. Nginx

```bash
sudo cp /home/deployer/lolstudy/deploy/nginx.conf \
        /etc/nginx/sites-available/lolstudy
sudo nginx -t                      # MUST pass before reloading
sudo systemctl reload nginx        # reload, not restart
```

`nginx -t` validates without applying. If it fails, nothing has changed yet.

**Rollback:**
```bash
sudo cp /etc/nginx/sites-available/lolstudy.bak.<STAMP> \
        /etc/nginx/sites-available/lolstudy
sudo nginx -t && sudo systemctl reload nginx
```

TLS is already issued for both hostnames and auto-renews via `certbot.timer`.
No certbot run is needed.

---

## 10. Smoke test

```bash
curl -s  https://esportsresearch.quest/api/health          # {"status":"ok"}
curl -sI https://esportsresearch.quest/                    # 200, text/html
curl -sI https://esportsresearch.quest/survey_cases.json   # 200, application/json
curl -sI https://esportsresearch.quest/case_outcomes.json  # 404  <- must be 404
curl -sI https://esportsresearch.quest/backend/.env        # 404  <- must be 404
curl -sI https://esportsresearch.quest/nonexistent-route   # 200 index.html (SPA)
```

Then complete one full ten-question run in a browser and confirm the results
summary appears **only after** submission succeeds.

---

## 11. Research export (later, on demand)

```bash
cd /home/deployer/lolstudy/backend
.venv/bin/python scripts/export_research_data.py --out exports/
```

`answers.csv` must have exactly ten rows per row in `responses.csv`; the script
exits non-zero otherwise. Retrieve and delete the server copies:

```bash
scp lolstudy-droplet:/home/deployer/lolstudy/backend/exports/*.csv ./
ssh lolstudy-droplet 'shred -u /home/deployer/lolstudy/backend/exports/*.csv'
```

Exports contain participant data. `exports/` and `*.csv` are gitignored.

---

## Full rollback to the books demo

```bash
cd /home/deployer/lolstudy
# 1. stop the survey API (Ctrl+C in the screen session)
# 2. restore Nginx
sudo cp /etc/nginx/sites-available/lolstudy.bak.<STAMP> \
        /etc/nginx/sites-available/lolstudy
sudo nginx -t && sudo systemctl reload nginx
# 3. restore code
git checkout $(cat ~/rollback-commit.txt)
# 4. restart the demo
source env/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

The survey database and role can stay; they do not affect the demo.

---

## Never commit / never serve

| Item | Why |
|---|---|
| `backend/data/case_outcomes.json` | the answer key |
| `backend/exports/*.csv` | participant responses |
| `backend/.env`, any `DATABASE_URL` | credentials |
| database passwords, dumps | credentials / participant data |

## Order of operations

1. Record rollback state (commit + Nginx backup)
2. Stop the demo
3. Pull code
4. Database + role
5. `.env` at mode 600
6. venv + `pip install -r requirements.txt`
7. `alembic upgrade head`
8. Import outcomes, verify counts, **shred the artifact**
9. Start uvicorn on `127.0.0.1:8000`
10. Nginx `-t`, then reload
11. Smoke test, then a full survey run
