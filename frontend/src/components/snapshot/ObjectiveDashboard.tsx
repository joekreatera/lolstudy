import StatIcon, { type StatIconName } from './StatIcon.tsx';
import { snapshotContent } from '../../content.ts';
import { text } from './typography.ts';
import type { TeamState } from '../../types/dataset.ts';

interface ObjectiveDashboardProps {
  blue: TeamState;
  red: TeamState;
}

interface ObjectiveRow {
  icon: StatIconName;
  label: string;
  blue: number;
  red: number;
}

/**
 * Compact mirrored objective band (not a data table). Each objective is one
 * dense cell — Blue count (left), icon + text label, Red count (right) — so the
 * five objectives read in a single row on wide screens and reflow to fewer
 * columns when narrow. Labels are always shown (icons only support them).
 * Counts carry screen-reader team labels; no differences, no emphasis.
 */
export default function ObjectiveDashboard({
  blue,
  red,
}: ObjectiveDashboardProps) {
  const rows: ObjectiveRow[] = [
    { icon: 'tower', label: 'Towers', blue: blue.towers, red: red.towers },
    {
      icon: 'inhibitor',
      label: 'Inhibitors',
      blue: blue.inhibitors,
      red: red.inhibitors,
    },
    { icon: 'dragon', label: 'Dragons', blue: blue.dragons, red: red.dragons },
    { icon: 'herald', label: 'Heralds', blue: blue.heralds, red: red.heralds },
    { icon: 'baron', label: 'Barons', blue: blue.barons, red: red.barons },
  ];

  return (
    <div>
      <p className={`mb-2 ${text.metricLabel}`}>Objectives</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-md bg-abyss-850 px-2 py-1.5"
          >
            <span
              className="text-right text-base font-semibold text-blue-400 tabular-nums"
              aria-label={`${snapshotContent.blueTeamLabel} ${row.label}: ${row.blue}`}
            >
              {row.blue}
            </span>
            <span className="flex min-w-0 flex-col items-center gap-0.5 text-slate-400">
              <StatIcon name={row.icon} size={15} />
              <span className={text.metricLabel}>{row.label}</span>
            </span>
            <span
              className="text-left text-base font-semibold text-red-400 tabular-nums"
              aria-label={`${snapshotContent.redTeamLabel} ${row.label}: ${row.red}`}
            >
              {row.red}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
