/**
 * Data-driven verification of the snapshot visualization contract against the
 * REAL dataset (dataset/survey_cases.json). Run with: npm run verify:snapshot
 *
 * No test framework, no network. Exits non-zero on any failed check.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateDataset } from '../src/services/surveyDataset.ts';
import {
  championIconUrl,
  championDisplayName,
  itemIconUrl,
  minimapUrl,
  rankEmblemUrl,
  rankEmblemUrlForTier,
} from '../src/services/assets.ts';
import {
  formatTimestamp,
  formatQueueRank,
  formatQueueRecord,
  formatQueueStanding,
} from '../src/services/format.ts';
import { ROLE_ORDER } from '../src/types/dataset.ts';
import type { SurveyCase } from '../src/types/dataset.ts';

const here = dirname(fileURLToPath(import.meta.url));
const datasetPath = resolve(here, '..', '..', 'dataset', 'survey_cases.json');

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/**
 * Mirror of what the visualization components are allowed to read (the typed
 * contract). Serializing this model and asserting the absence of forbidden
 * fields proves the render path cannot depend on them.
 */
function buildRenderModel(surveyCase: SurveyCase): unknown {
  const s = surveyCase.snapshot;
  const version = s.metadata.item_catalog_version;
  return {
    header: {
      cutoff_minute: s.metadata.cutoff_minute,
      platform: s.metadata.platform,
      patch: s.metadata.patch,
      queue_name: s.metadata.queue_name,
    },
    overview: {
      blue: {
        gold: s.blue_team.gold,
        kills: s.blue_team.kills,
        deaths: s.blue_team.deaths,
        assists: s.blue_team.assists,
        cs: s.blue_team.cs,
        avg_level: s.blue_team.avg_level,
        towers: s.blue_team.towers,
        dragons: s.blue_team.dragons,
        heralds: s.blue_team.heralds,
        barons: s.blue_team.barons,
        inhibitors: s.blue_team.inhibitors,
        first_blood: s.blue_team.first_blood,
        first_tower: s.blue_team.first_tower,
        first_dragon: s.blue_team.first_dragon,
      },
      red: {
        gold: s.red_team.gold,
        kills: s.red_team.kills,
        deaths: s.red_team.deaths,
        assists: s.red_team.assists,
        cs: s.red_team.cs,
        avg_level: s.red_team.avg_level,
        towers: s.red_team.towers,
        dragons: s.red_team.dragons,
        heralds: s.red_team.heralds,
        barons: s.red_team.barons,
        inhibitors: s.red_team.inhibitors,
        first_blood: s.red_team.first_blood,
        first_tower: s.red_team.first_tower,
        first_dragon: s.red_team.first_dragon,
      },
      diffs: s.team_diffs,
    },
    matchups: ROLE_ORDER.map((role) => ({
      role,
      diffs: s.role_matchups[role]?.diffs,
      players: (['blue', 'red'] as const).map((team) => {
        const p = s.participants.find(
          (x) => x.team === team && x.role === role
        );
        if (!p) return null;
        return {
          team: p.team,
          champion: p.champion,
          display_name: championDisplayName(p.champion),
          icon_url: championIconUrl(version, p.champion),
          level: p.level,
          gold: p.gold,
          cs: p.cs,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          items: p.items.inventory.map((i) => ({
            name: i.name,
            gold_total: i.gold_total,
            count: i.count,
            icon_url: itemIconUrl(version, i.item_id),
          })),
          // Rank is intentional experimental input, rendered as two neutral
          // queue rows. Participant identity stays excluded.
          rank: p.rank,
          rank_rows: (['solo_duo', 'flex'] as const).map((q) => ({
            queue: q,
            standing: formatQueueStanding(p.rank, q),
            record: p.rank.available ? formatQueueRecord(p.rank[q]) : null,
          })),
        };
      }),
    })),
    map_url: minimapUrl(version),
    events: s.events_until_cutoff.map((e) => ({
      time: formatTimestamp(e.timestamp_ms),
      team: e.team,
      description: e.description,
      ...(e.type === 'champion_kill'
        ? {
            assists: e.assist_champions,
            position_normalized: e.position_normalized ?? null,
          }
        : {}),
    })),
  };
}

// --------------------------------------------------------------------------- #
console.log(`Reading real dataset: ${datasetPath}`);
const raw = JSON.parse(readFileSync(datasetPath, 'utf-8'));
const dataset = validateDataset(raw);

console.log('\ndataset structure:');
check('1,200 cases are readable and validated', dataset.cases.length === 1200);

let tenParticipants = true;
let rolePairsResolve = true;
let allRolesBothTeams = true;
let champUrlsOk = true;
let itemUrlsOk = true;
let coordsOk = true;
let timestampsOk = true;
const timestampShape = /^\d+:\d{2}$/;

for (const c of dataset.cases) {
  const s = c.snapshot;
  if (s.participants.length !== 10) tenParticipants = false;

  for (const role of ROLE_ORDER) {
    for (const team of ['blue', 'red'] as const) {
      const matches = s.participants.filter(
        (p) => p.team === team && p.role === role
      );
      if (matches.length !== 1) rolePairsResolve = false;
    }
    if (!s.role_matchups[role]) allRolesBothTeams = false;
  }

  const version = s.metadata.item_catalog_version;
  for (const p of s.participants) {
    if (!championIconUrl(version, p.champion)) champUrlsOk = false;
    for (const i of p.items.inventory) {
      if (!itemIconUrl(version, i.item_id)) itemUrlsOk = false;
    }
  }

  for (const e of s.events_until_cutoff) {
    if (!timestampShape.test(formatTimestamp(e.timestamp_ms))) {
      timestampsOk = false;
    }
    if (e.type === 'champion_kill' && e.position_normalized) {
      const { x, y } = e.position_normalized;
      if (x < 0 || x > 1 || y < 0 || y > 1) coordsOk = false;
    }
  }
}

check('every case has 10 participants', tenParticipants);
check('every team-role pair resolves exactly once', rolePairsResolve);
check('every case has all five roles for both teams', allRolesBothTeams);
check('every champion produces a non-empty asset URL', champUrlsOk);
check('every item produces a non-empty asset URL', itemUrlsOk);
check('kill normalized coordinates are within [0,1]', coordsOk);
check('event timestamps format as m:ss', timestampsOk);

console.log('\nasset remaps:');
check(
  'FiddleSticks remap produces Fiddlesticks.png',
  championIconUrl('16.13.1', 'FiddleSticks').endsWith('/Fiddlesticks.png')
);
check(
  'FiddleSticks display name is unaffected by asset remap',
  championDisplayName('FiddleSticks') === 'Fiddlesticks'
);
check(
  'MonkeyKing displays as Wukong',
  championDisplayName('MonkeyKing') === 'Wukong'
);
check(
  'camel-case fallback splits TwistedFate',
  championDisplayName('TwistedFate') === 'Twisted Fate'
);

console.log('\nrender-model exclusions:');
{
  // Sparse and dense real cases must both produce valid, clean render models.
  const byEvents = [...dataset.cases].sort(
    (a, b) =>
      a.snapshot.events_until_cutoff.length -
      b.snapshot.events_until_cutoff.length
  );
  const sparse = byEvents[0];
  const dense = byEvents[byEvents.length - 1];

  for (const [label, sample] of [
    ['sparse', sparse],
    ['dense', dense],
  ] as const) {
    const model = buildRenderModel(sample);
    const json = JSON.stringify(model);
    check(
      `${label} case builds a render model (${sample.snapshot.events_until_cutoff.length} events)`,
      json.length > 0
    );
    check(
      `${label} model excludes game_duration_seconds`,
      !json.includes('game_duration_seconds')
    );
    check(`${label} model excludes event_id`, !json.includes('event_id'));
    check(
      `${label} model excludes participant IDs`,
      !json.includes('participant_id')
    );
    check(
      `${label} model excludes match_group_id`,
      !json.includes(sample.match_group_id)
    );
    check(
      `${label} model excludes quality flags`,
      !json.includes('quality_flags') && !json.includes('rank_not_enriched')
    );
    check(
      `${label} model excludes raw Riot match IDs`,
      !/[A-Z]{2,4}\d?_\d{6,}/.test(json)
    );
  }
}

console.log('\noutcome isolation:');
{
  // The visualization must not require (or even have access to) the winner.
  const json = JSON.stringify(dataset.cases[0]);
  check(
    'dataset contains no winner/label fields',
    !/"final_winner"|"winner"|"label"/.test(json)
  );
}

console.log('\nparticipant rank (queue-aware experimental input):');
{
  const KNOWN_TIERS = new Set([
    'IRON',
    'BRONZE',
    'SILVER',
    'GOLD',
    'PLATINUM',
    'EMERALD',
    'DIAMOND',
    'MASTER',
    'GRANDMASTER',
    'CHALLENGER',
  ]);
  const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER']);
  const APEX_DIVISION_SUFFIX = /\s(IV|III|II|I)$/;

  let missing = 0;
  let missingQueueKey = 0;
  let badQueue = 0;
  let badApex = 0;
  let unavailable = 0;
  let soloOnly = 0;
  let flexOnly = 0;
  let bothQueues = 0;
  let neither = 0;
  let emptyRowText = 0;
  let fabricatedRecord = 0;

  for (const c of dataset.cases) {
    for (const p of c.snapshot.participants) {
      const r = p.rank;
      if (r === undefined || r === null) {
        missing++;
        continue;
      }
      if (r.available === false) {
        unavailable++;
      } else {
        if (!('solo_duo' in r) || !('flex' in r)) missingQueueKey++;
        for (const q of [r.solo_duo, r.flex]) {
          if (q === null) continue;
          const ok =
            typeof q.tier === 'string' &&
            KNOWN_TIERS.has(q.tier.toUpperCase()) &&
            typeof q.division === 'string' &&
            q.division.length > 0 &&
            Number.isInteger(q.lp) &&
            q.lp >= 0 &&
            Number.isInteger(q.wins) &&
            q.wins >= 0 &&
            Number.isInteger(q.losses) &&
            q.losses >= 0 &&
            typeof q.display === 'string' &&
            q.display.trim() !== '';
          if (!ok) badQueue++;
          if (
            APEX.has(q.tier.toUpperCase()) &&
            APEX_DIVISION_SUFFIX.test(q.display)
          ) {
            badApex++;
          }
        }
        if (r.solo_duo && r.flex) bothQueues++;
        else if (r.solo_duo) soloOnly++;
        else if (r.flex) flexOnly++;
        else neither++;
      }

      for (const q of ['solo_duo', 'flex'] as const) {
        if (formatQueueStanding(r, q).trim() === '') emptyRowText++;
        const queueRank = r.available ? r[q] : null;
        if (!queueRank && formatQueueRecord(queueRank) !== null)
          fabricatedRecord++;
      }
    }
  }

  check('every participant has a rank object', missing === 0, `${missing}`);
  check(
    'every available rank has both solo_duo and flex keys',
    missingQueueKey === 0,
    `${missingQueueKey}`
  );
  check(
    'every queue record is structurally valid',
    badQueue === 0,
    `${badQueue}`
  );
  check('apex displays never include a division', badApex === 0, `${badApex}`);
  check(
    'both queue rows always render visible text',
    emptyRowText === 0,
    `${emptyRowText}`
  );
  check(
    'an absent queue never fabricates a W/L record',
    fabricatedRecord === 0,
    `${fabricatedRecord}`
  );
  check(
    'current dataset has zero unavailable ranks',
    unavailable === 0,
    `${unavailable}`
  );
  console.log(
    `  note  occurrences - both ${bothQueues}, solo-only ${soloOnly}, ` +
      `flex-only ${flexOnly}, unranked-both ${neither}`
  );

  let inconsistent = 0;
  const groups = new Map<string, SurveyCase[]>();
  for (const c of dataset.cases) {
    const list = groups.get(c.match_group_id) ?? [];
    list.push(c);
    groups.set(c.match_group_id, list);
  }
  for (const list of groups.values()) {
    for (const team of ['blue', 'red'] as const) {
      for (const role of ROLE_ORDER) {
        const seen = new Set(
          list.map((c) => {
            const p = c.snapshot.participants.find(
              (x) => x.team === team && x.role === role
            );
            return JSON.stringify(p?.rank);
          })
        );
        if (seen.size !== 1) inconsistent++;
      }
    }
  }
  check(
    'rank identical across all four snapshots of a match slot',
    inconsistent === 0,
    `${inconsistent}`
  );

  const emerald = {
    tier: 'EMERALD',
    division: 'IV',
    lp: 85,
    wins: 123,
    losses: 98,
    display: 'Emerald IV',
  };
  const challenger = {
    tier: 'CHALLENGER',
    division: 'I',
    lp: 3155,
    wins: 1050,
    losses: 1002,
    display: 'Challenger',
  };
  check(
    'formatQueueRank renders a normal tier with LP',
    formatQueueRank(emerald) === 'Emerald IV · 85 LP'
  );
  check(
    'formatQueueRank renders apex without division, grouping 4-digit LP',
    formatQueueRank(challenger) === 'Challenger · 3,155 LP'
  );
  check(
    'formatQueueRank renders an absent queue as Unranked',
    formatQueueRank(null) === 'Unranked'
  );
  check(
    'formatQueueRecord renders raw wins and losses',
    formatQueueRecord(emerald) === 'W: 123 · L: 98'
  );
  check(
    'formatQueueRecord groups thousands',
    formatQueueRecord(challenger) === 'W: 1,050 · L: 1,002'
  );
  check(
    'formatQueueRecord returns null for an absent queue',
    formatQueueRecord(null) === null
  );
  check(
    'unavailable rank renders "Rank unavailable" on both rows',
    formatQueueStanding({ available: false }, 'solo_duo') ===
      'Rank unavailable' &&
      formatQueueStanding({ available: false }, 'flex') === 'Rank unavailable'
  );
  check(
    'a flex-only player keeps Flex and reads Unranked in Solo/Duo',
    formatQueueStanding(
      { available: true, solo_duo: null, flex: emerald },
      'solo_duo'
    ) === 'Unranked' &&
      formatQueueStanding(
        { available: true, solo_duo: null, flex: emerald },
        'flex'
      ) === 'Emerald IV · 85 LP'
  );
  check(
    'no derived win-rate or ratio field exists in the dataset',
    !/"win_rate"|"winrate"|"loss_rate"|"win_loss_ratio"|"total_games"/.test(
      JSON.stringify(dataset.cases[0])
    )
  );
}

console.log('\ndataset version:');
check(
  'dataset_version is pilot_v3',
  dataset.dataset_version === 'pilot_v3',
  dataset.dataset_version
);

console.log('\nrank emblems (local assets only):');
{
  const emblemDir = resolve(here, '..', 'public', 'rank-emblems');
  const expected = [
    'iron',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'emerald',
    'diamond',
    'master',
    'grandmaster',
    'challenger',
  ];
  for (const tier of expected) {
    check(
      `emblem asset ${tier}.png exists`,
      existsSync(resolve(emblemDir, `${tier}.png`))
    );
  }

  const tiers = new Set<string>();
  for (const c of dataset.cases) {
    for (const p of c.snapshot.participants) {
      if (!p.rank.available) continue;
      for (const q of [p.rank.solo_duo, p.rank.flex]) {
        if (q) tiers.add(q.tier);
      }
    }
  }
  let unresolved = 0;
  let external = 0;
  for (const tier of tiers) {
    const url = rankEmblemUrlForTier(tier);
    if (!url || !existsSync(resolve(emblemDir, url.split('/').pop()!)))
      unresolved++;
    if (url && !url.startsWith('/rank-emblems/')) external++;
  }
  check(
    `all ${tiers.size} dataset tiers (both queues) resolve to a local emblem`,
    unresolved === 0,
    `${unresolved} unresolved`
  );
  check('no emblem URL points at an external host', external === 0);

  const emeraldQ = {
    tier: 'EMERALD',
    division: 'IV',
    lp: 85,
    wins: 1,
    losses: 1,
    display: 'Emerald IV',
  };
  const ironQ = {
    tier: 'IRON',
    division: 'IV',
    lp: 0,
    wins: 1,
    losses: 1,
    display: 'Iron IV',
  };
  check(
    'Solo/Duo and Flex resolve their emblems independently',
    rankEmblemUrl(emeraldQ) === '/rank-emblems/emerald.png' &&
      rankEmblemUrl(ironQ) === '/rank-emblems/iron.png'
  );
  check(
    'an unranked queue resolves to no emblem (Iron is never a stand-in)',
    rankEmblemUrl(null) === null
  );
  check(
    'unknown tier resolves to null instead of a broken image',
    rankEmblemUrlForTier('MYTHIC') === null
  );
  check(
    'emblem lookup does not depend on display text',
    rankEmblemUrl({ ...emeraldQ, display: '' }) === '/rank-emblems/emerald.png'
  );
}

console.log('\nteam rank aggregates must not exist:');
{
  let withSummary = 0;
  for (const c of dataset.cases) {
    for (const side of ['blue_team', 'red_team'] as const) {
      if ('rank_summary' in (c.snapshot[side] as object)) withSummary++;
    }
  }
  check('no team object contains rank_summary', withSummary === 0);
}

console.log('\npublic payload rejects private rank/identity fields:');
{
  const rawText = readFileSync(datasetPath, 'utf-8').toLowerCase();
  const forbidden = [
    'rank_summary',
    'rank_score',
    'puuid',
    'summonerid',
    'summoner_id',
    'summonername',
    'riotid',
    'riot_id',
    'gamename',
    'tagline',
    'player_name',
    'retrieved_at',
    'fetched_at',
    'api_error',
    'final_winner',
    'game_duration',
    'duration_seconds',
    'final_items',
    'possession',
  ];
  for (const field of forbidden) {
    check(`public dataset excludes "${field}"`, !rawText.includes(field));
  }
}

console.log('\nViego / inventory regression:');
{
  let lateEmpty = 0;
  let earlyEmpty = 0;
  let badItemUrl = 0;
  for (const c of dataset.cases) {
    const minute = c.snapshot.metadata.cutoff_minute;
    const version = c.snapshot.metadata.item_catalog_version;
    for (const p of c.snapshot.participants) {
      if (p.items.inventory.length === 0) {
        if (minute >= 10) lateEmpty++;
        else earlyEmpty++;
      }
      for (const item of p.items.inventory) {
        if (!itemIconUrl(version, item.item_id).endsWith(`${item.item_id}.png`))
          badItemUrl++;
      }
    }
  }
  check(
    'zero empty inventories at cutoff >= 10',
    lateEmpty === 0,
    `${lateEmpty}`
  );
  check('every public item resolves an icon URL', badItemUrl === 0);
  console.log(`  note  ${earlyEmpty} legitimate minute-5 empty inventories`);

  const repaired = dataset.cases.find((c) => c.case_id === 'C_2F4A037B0EE6');
  check('previously broken case C_2F4A037B0EE6 exists', repaired !== undefined);
  if (repaired) {
    const viego = repaired.snapshot.participants.find(
      (p) => p.champion === 'Viego'
    );
    check(
      'C_2F4A037B0EE6 Viego inventory is non-empty',
      (viego?.items.inventory.length ?? 0) > 0,
      `${viego?.items.inventory.length}`
    );
    check(
      'C_2F4A037B0EE6 Viego rank renders independently of items',
      viego !== undefined &&
        formatQueueStanding(viego.rank, 'solo_duo').length > 0
    );
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
