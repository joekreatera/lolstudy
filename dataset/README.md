# dataset/

The survey source dataset lives here as:

```
dataset/survey_cases.json
```

It is **gitignored** — it is data produced by the upstream exporter
(`lol-strategic-prediction` / `lol-win-prediction-llm`), not source code, and it
must never be committed.

At `npm run dev` / `npm run build`, `frontend/scripts/sync-dataset.mjs` copies
this file to `frontend/public/survey_cases.json` (also gitignored) so Vite can
serve it as a static asset at `/survey_cases.json`. The backend never touches
it.

## Required contract

Each case must include an opaque `match_group_id` so the survey can guarantee a
participant never sees two snapshots from the same match. See the repo README
for the full contract and the upstream exporter patch that produces it.
