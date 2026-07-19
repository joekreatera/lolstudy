import { formatSigned } from '../../services/format.ts';
import { useContent } from '../../i18n/context.ts';
import type { RoleDiffs, RoleKey } from '../../types/dataset.ts';

interface MatchupDiffProps {
  role: RoleKey;
  diffs: RoleDiffs | undefined;
}

/**
 * Center gutter of a lane matchup: the role label (the row's anchor) plus
 * neutral Blue − Red differences for gold, CS, and level. Identical gray
 * styling regardless of sign; no arrows, colors, or "winning lane" language.
 */
export default function MatchupDiff({ role, diffs }: MatchupDiffProps) {
  const snapshotContent = useContent().snapshot;
  const metrics = snapshotContent.metrics;

  const chips = diffs
    ? [
        { label: metrics.gold, value: formatSigned(diffs.gold_blue_minus_red) },
        { label: metrics.cs, value: formatSigned(diffs.cs_blue_minus_red) },
        {
          label: metrics.level,
          value: formatSigned(diffs.level_blue_minus_red),
        },
      ]
    : [];

  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold tracking-widest text-slate-300 uppercase">
        {snapshotContent.roles[role]}
      </p>
      {chips.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400 sm:flex-col sm:gap-y-1">
          {chips.map((c) => (
            <span key={c.label} className="whitespace-nowrap">
              {c.label}{' '}
              <span className="font-medium text-slate-300 tabular-nums">
                {c.value}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
