import MatchContextHeader from './MatchContextHeader.tsx';
import MatchScoreboard from './MatchScoreboard.tsx';
import MatchupSection from './MatchupSection.tsx';
import MatchEventsSection from './MatchEventsSection.tsx';
import type { SurveySnapshot } from '../../types/dataset.ts';

interface SnapshotViewProps {
  snapshot: SurveySnapshot;
  questionNumber: number;
  totalQuestions: number;
}

/**
 * The complete competitive match-analysis dashboard for one case, in a fixed
 * reading order: context header → scoreboard → lane matchups → map & events.
 * Purely presentational; survey progression and answer state stay in
 * SurveyStep (which renders the prediction panel beneath this view).
 */
export default function SnapshotView({
  snapshot,
  questionNumber,
  totalQuestions,
}: SnapshotViewProps) {
  const version = snapshot.metadata.item_catalog_version;

  return (
    <div className="space-y-3">
      <MatchContextHeader
        metadata={snapshot.metadata}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />

      <MatchScoreboard
        blue={snapshot.blue_team}
        red={snapshot.red_team}
        diffs={snapshot.team_diffs}
      />

      <MatchupSection
        participants={snapshot.participants}
        roleMatchups={snapshot.role_matchups}
        version={version}
      />

      <MatchEventsSection
        events={snapshot.events_until_cutoff}
        version={version}
        cutoffMinute={snapshot.metadata.cutoff_minute}
      />
    </div>
  );
}
