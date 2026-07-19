# LoL Strategic Prediction Survey

## Overview

This is a university research project investigating a single question: **can an
AI predict the winner of a League of Legends match more accurately than
experienced human players, when both receive exactly the same objective match
information?**

The comparison only means something if the inputs are identical. Human
participants and the language models under study are shown the same structured
snapshots of real matches — the same statistics, the same objectives, the same
timeline — with no commentary, no hindsight, and nothing that reveals how the
match actually ended. Any advantage either side shows should come from
judgement about the game state, not from unequal information.

This repository contains the participant-facing survey application: the web
interface players use, the API that records their predictions, and the private
scoring logic that grades a completed run.

## Research Flow

Participants see snapshots taken at **5, 10, 15 and 20 minutes** into real
matches, and answer ten prediction questions in one sitting:

1. **Consent** — the study is explained and consent is recorded.
2. **Experience questions** — rank, years playing, main role, how often they
   play, and region.
3. **Ten match predictions** — one snapshot per question; the participant
   predicts which team will win.
4. **One complete submission** — all ten answers are sent together, once.
5. **Private server-side scoring** — the API compares the answers against
   outcomes held only in the database.
6. **Final result summary** — the participant sees how many they got right.

**No correctness feedback is shown during the ten questions.** A participant
learns nothing about any match until the whole survey has been submitted and
stored, so earlier answers cannot be informed by later ones.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Nginx

## Repository Structure

```text
backend/       FastAPI API, database models, migrations and private scripts
frontend/      React survey application and production build
dataset/       Public survey cases without winner labels
deploy/        Nginx and deployment reference files
docs/          Additional project and server documentation
```

## Local Development

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

**Backend**

```bash
cd backend
python -m venv .venv
```

Activate the environment — Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Then install and run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The full backend workflow requires a running PostgreSQL instance and a valid
`DATABASE_URL` in `backend/.env`. Copy `backend/.env.example` as a starting
point and fill in your own local values.

## Production

Production serves the prebuilt static frontend through Nginx, with FastAPI and
Uvicorn behind it and PostgreSQL as the database. Alembic owns the schema, and
all configuration comes from private environment variables kept outside Git.

- Deployment details: [`deploy/README.md`](deploy/README.md)
- Original droplet notes: [`docs/original-server-notes.md`](docs/original-server-notes.md)

## Privacy and Research Integrity

The survey is only valid if participants cannot discover the answers. The public
dataset served to the browser must **never** contain:

- winner labels
- Riot match IDs
- PUUIDs
- Riot IDs
- player names
- future timeline information beyond the snapshot's cutoff
- private outcome metadata

Match outcomes are stored privately in PostgreSQL. They are not bundled with
the frontend and cannot be requested through an answer-key endpoint, and no
correctness feedback is returned while the ten questions are being answered.
FastAPI resolves outcomes privately and returns the participant's aggregate
score and per-question results — including the actual winning team — only after
all ten answers have been successfully persisted.

An incomplete or invalid submission is never scored. An exact retry of a
submission that already succeeded returns the same stored result without
creating additional records, and a conflicting retry is rejected rather than
overwriting the original.

No name, email, Riot ID, IP address, or account identifier is intentionally
collected. Responses are pseudonymous and are analysed in aggregate.

`case_outcomes.json`, `.env` files, research exports and participant data must
never be committed to this repository.

## License

MIT — see [`LICENSE`](LICENSE).
