import { useContent } from '../../i18n/context.ts';
import { formatNumber, formatSigned } from '../../services/format.ts';
import StatIcon, { type StatIconName } from './StatIcon.tsx';
import { TeamTag } from './ui.tsx';
import { text } from './typography.ts';
import ObjectiveDashboard from './ObjectiveDashboard.tsx';
import FirstObjectiveStrip from './FirstObjectiveStrip.tsx';
import type { TeamState, TeamDiffs } from '../../types/dataset.ts';

interface MatchScoreboardProps {
  blue: TeamState;
  red: TeamState;
  diffs: TeamDiffs;
}

interface MetricRow {
  key: string;
  icon: StatIconName;
  label: string;
  srLabel?: string;
  blue: string;
  red: string;
  delta: string | null;
  valueClass: string;
}

/**
 * The primary match scoreboard: two team halves flanking a central metric
 * comparison (gold strongest, then K/D/A, CS, average level), with an
 * objective dashboard and first-objective strip. Blue always left, Red always
 * right, identical weight. Differences are exact, neutral gray, sign-agnostic.
 */
export default function MatchScoreboard({
  blue,
  red,
  diffs,
}: MatchScoreboardProps) {
  const snapshotContent = useContent().snapshot;
  const metrics = snapshotContent.metrics;
  const kda = (t: TeamState) => `${t.kills} / ${t.deaths} / ${t.assists}`;

  const rows: MetricRow[] = [
    {
      key: 'gold',
      icon: 'gold',
      label: metrics.gold,
      blue: formatNumber(blue.gold),
      red: formatNumber(red.gold),
      delta: formatSigned(diffs.gold_blue_minus_red),
      valueClass: 'text-3xl sm:text-4xl font-bold',
    },
    {
      key: 'kda',
      icon: 'kda',
      label: metrics.kda,
      srLabel: metrics.kdaSrLabel,
      blue: kda(blue),
      red: kda(red),
      delta: null,
      valueClass: 'text-lg sm:text-xl font-semibold',
    },
    {
      key: 'cs',
      icon: 'cs',
      label: metrics.cs,
      srLabel: metrics.csSrLabel,
      blue: formatNumber(blue.cs),
      red: formatNumber(red.cs),
      delta: formatSigned(diffs.cs_blue_minus_red),
      valueClass: 'text-lg font-semibold',
    },
    {
      key: 'level',
      icon: 'level',
      label: metrics.avgLevel,
      srLabel: metrics.avgLevelSrLabel,
      blue: blue.avg_level.toFixed(1),
      red: red.avg_level.toFixed(1),
      delta: formatSigned(diffs.avg_level_blue_minus_red, 1),
      valueClass: 'text-lg font-semibold',
    },
  ];

  return (
    <section className="rounded-xl border border-abyss-700 bg-abyss-900 p-4 sm:p-5">
      {/* Card heading + a comfortably readable delta definition. */}
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={text.sectionHeading}>
          {snapshotContent.teamOverviewTitle}
        </h2>
        <p className={text.helper} aria-hidden="true">
          {snapshotContent.deltaExplanation}
        </p>
      </div>

      {/* Primary metric comparison. Team names sit directly above their own
          value columns (proximity + repetition), each column capped by a thin,
          equal-weight side line so identity never rests on color alone. */}
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {snapshotContent.teamOverviewTitle}.{' '}
          {snapshotContent.deltaExplanation}.
        </caption>
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[24%]" />
          <col className="w-[38%]" />
        </colgroup>
        <thead>
          <tr>
            <th className="border-b-2 border-blue-400/30 pr-2 pb-2 text-right">
              <TeamTag side="blue" align="left" />
            </th>
            <th aria-hidden="true" className="pb-2" />
            <th className="border-b-2 border-red-400/30 pb-2 pl-2 text-left">
              <TeamTag side="red" align="right" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td
                className={`py-2 pr-2 text-right whitespace-nowrap text-slate-100 tabular-nums ${row.valueClass}`}
              >
                {row.blue}
              </td>
              <th scope="row" className="px-1 py-2 text-center align-middle">
                <span className="flex items-center justify-center gap-1.5 text-slate-400">
                  <StatIcon name={row.icon} />
                  <span className={text.metricLabel}>{row.label}</span>
                  {row.srLabel && (
                    <span className="sr-only">{row.srLabel}</span>
                  )}
                </span>
                {row.delta !== null && (
                  <span className="mt-1 inline-block rounded bg-abyss-800 px-1.5 py-0.5 text-[10px] whitespace-nowrap text-slate-400 tabular-nums">
                    Δ {row.delta}
                  </span>
                )}
              </th>
              <td
                className={`py-2 pl-2 text-left whitespace-nowrap text-slate-100 tabular-nums ${row.valueClass}`}
              >
                {row.red}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Objectives — a compact mirrored band, part of the same card. */}
      <div className="mt-4 border-t border-abyss-800 pt-4">
        <ObjectiveDashboard blue={blue} red={red} />
      </div>

      {/* First objectives — one dense strip beneath the objective band. */}
      <div className="mt-4 border-t border-abyss-800 pt-4">
        <FirstObjectiveStrip blue={blue} red={red} />
      </div>
    </section>
  );
}
