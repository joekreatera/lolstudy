import PlayerCard from './PlayerCard.tsx';
import MatchupDiff from './MatchupDiff.tsx';
import { Panel } from './ui.tsx';
import { snapshotContent } from '../../content.ts';
import {
  ROLE_ORDER,
  type ParticipantState,
  type RoleKey,
  type RoleMatchups,
  type TeamSide,
} from '../../types/dataset.ts';

interface MatchupSectionProps {
  participants: ParticipantState[];
  roleMatchups: RoleMatchups;
  version: string;
}

/** Join a participant by team + role (never by participant ID). */
function findParticipant(
  participants: ParticipantState[],
  team: TeamSide,
  role: RoleKey
): ParticipantState | undefined {
  return participants.find((p) => p.team === team && p.role === role);
}

/**
 * The five lane matchups. Each row is a mirrored player comparison — Blue card
 * left, Red card right, role + neutral differences in the center. On mobile
 * the center strip stacks above the two side-by-side cards (Blue/Red stay
 * paired, never all-Blue-then-all-Red).
 */
export default function MatchupSection({
  participants,
  roleMatchups,
  version,
}: MatchupSectionProps) {
  return (
    <Panel title={snapshotContent.laneMatchupsTitle}>
      <div className="divide-y divide-abyss-800">
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            className="grid grid-cols-2 items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[1fr_8rem_1fr]"
          >
            <div className="col-span-2 sm:order-2 sm:col-span-1">
              <MatchupDiff role={role} diffs={roleMatchups[role]?.diffs} />
            </div>
            <div className="sm:order-1">
              <PlayerCard
                player={findParticipant(participants, 'blue', role)}
                version={version}
                side="blue"
              />
            </div>
            <div className="sm:order-3">
              <PlayerCard
                player={findParticipant(participants, 'red', role)}
                version={version}
                side="red"
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
