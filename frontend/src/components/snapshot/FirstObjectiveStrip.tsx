import { TeamDot } from './ui.tsx';
import { text } from './typography.ts';
import { snapshotContent } from '../../content.ts';
import type { TeamSide, TeamState } from '../../types/dataset.ts';

interface FirstObjectiveStripProps {
  blue: TeamState;
  red: TeamState;
}

/**
 * First blood / tower / dragon ownership as three neutral pills. Muted
 * surfaces, plain team labels — no trophies, medals, checkmarks, or
 * celebratory styling.
 */
export default function FirstObjectiveStrip({
  blue,
  red,
}: FirstObjectiveStripProps) {
  const pills: { label: string; owner: TeamSide | null }[] = [
    {
      label: snapshotContent.firstBloodLabel,
      owner: blue.first_blood ? 'blue' : red.first_blood ? 'red' : null,
    },
    {
      label: snapshotContent.firstTowerLabel,
      owner: blue.first_tower ? 'blue' : red.first_tower ? 'red' : null,
    },
    {
      label: snapshotContent.firstDragonLabel,
      owner: blue.first_dragon ? 'blue' : red.first_dragon ? 'red' : null,
    },
  ];

  return (
    <div>
      <p className={`mb-2 ${text.metricLabel}`}>
        {snapshotContent.firstObjectivesTitle}
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {pills.map(({ label, owner }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-2 rounded-md bg-abyss-850 px-3 py-2"
          >
            <span className={text.metricLabel}>{label}</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              {owner && <TeamDot side={owner} />}
              {owner === 'blue'
                ? snapshotContent.blueTeamLabel
                : owner === 'red'
                  ? snapshotContent.redTeamLabel
                  : snapshotContent.noneOwnerLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
