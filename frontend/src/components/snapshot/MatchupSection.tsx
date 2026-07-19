import PlayerCard from './PlayerCard.tsx';
import MatchupDiff from './MatchupDiff.tsx';
import { Panel, TeamTag } from './ui.tsx';
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
 * left, Red card right, role + neutral differences in the center.
 *
 * Below `sm` the row is a single column: the center strip first, then the Blue
 * card, then the Red card. Two side-by-side cards left each one only ~125px at
 * 320px wide, and a 56px portrait inside that leaves a ~59px stats column for a
 * Gold/CS cluster needing ~122px — so both cards overflowed into each other and
 * Blue's numbers were painted over Red's. Stacking gives each card the full
 * row width; the pair still reads as one matchup because the role strip heads
 * it and each card is tagged with its team. Blue/Red stay paired per lane,
 * never all-Blue-then-all-Red.
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
            className="grid grid-cols-1 items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[1fr_8rem_1fr]"
          >
            <div className="sm:order-2">
              <MatchupDiff role={role} diffs={roleMatchups[role]?.diffs} />
            </div>
            <div className="sm:order-1">
              {/* Stacked cards lose the left/right cue that identifies a side,
                  so each card states its team outright. Hidden from `sm` up,
                  where position and the portrait ring already carry it. */}
              <div className="mb-1 sm:hidden">
                <TeamTag side="blue" align="left" />
              </div>
              <PlayerCard
                player={findParticipant(participants, 'blue', role)}
                version={version}
                side="blue"
              />
            </div>
            <div className="sm:order-3">
              <div className="mb-1 flex justify-end sm:hidden">
                <TeamTag side="red" align="right" />
              </div>
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
