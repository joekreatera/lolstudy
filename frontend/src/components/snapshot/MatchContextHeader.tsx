import { surveyContent, snapshotContent } from '../../content.ts';
import { platformLabel } from '../../services/assets.ts';
import { formatTimestamp } from '../../services/format.ts';
import { text } from './typography.ts';
import type { SnapshotMetadata } from '../../types/dataset.ts';

interface MatchContextHeaderProps {
  metadata: SnapshotMetadata;
  questionNumber: number;
  totalQuestions: number;
}

/**
 * Game-state context bar. The snapshot clock is the primary element; question
 * progress and region/patch/queue are secondary metadata. Belongs to neither
 * team — no Blue/Red color. Never shows duration, versions, or identifiers.
 */
export default function MatchContextHeader({
  metadata,
  questionNumber,
  totalQuestions,
}: MatchContextHeaderProps) {
  const clock = formatTimestamp(metadata.cutoff_minute * 60_000);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-abyss-700 bg-abyss-900 px-4 py-3">
      <div className="flex items-baseline gap-2.5">
        <span className={text.eyebrow}>{snapshotContent.gameStateLabel}</span>
        <span className="font-mono text-3xl leading-none font-bold tracking-tight text-slate-100 tabular-nums sm:text-4xl">
          {clock}
        </span>
      </div>

      <div className="text-right">
        <p className={text.sectionHeading}>
          {surveyContent.progressLabel(questionNumber, totalQuestions)}
        </p>
        <p className={`mt-0.5 ${text.helper}`}>
          {platformLabel(metadata.platform)}
          <span className="mx-1 text-slate-600" aria-hidden="true">
            ·
          </span>
          Patch {metadata.patch}
          <span className="mx-1 text-slate-600" aria-hidden="true">
            ·
          </span>
          {metadata.queue_name}
        </p>
      </div>
    </div>
  );
}
