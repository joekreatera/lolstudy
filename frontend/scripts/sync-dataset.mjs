// Smallest possible dataset sync: copy the repo-root source dataset into the
// frontend's public/ folder so Vite can serve it as a static asset. Runs
// automatically via the `predev` and `prebuild` npm scripts.
//
// This is intentionally NOT a general asset pipeline. It copies exactly one
// file and never modifies the source.

import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const source = resolve(repoRoot, 'dataset', 'survey_cases.json');
const destDir = resolve(here, '..', 'public');
const dest = resolve(destDir, 'survey_cases.json');

if (!existsSync(source)) {
  console.error(
    `\n[sync-dataset] Source dataset not found:\n  ${source}\n\n` +
      `Place the exported survey_cases.json at dataset/survey_cases.json ` +
      `(it is gitignored). See dataset/README.md.\n`
  );
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);

const kb = Math.round(statSync(dest).size / 1024);
console.log(`[sync-dataset] Copied dataset → frontend/public/survey_cases.json (${kb} KB)`);
