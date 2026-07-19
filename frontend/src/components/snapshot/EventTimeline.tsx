import { useContent } from '../../i18n/context.ts';
import { championDisplayName } from '../../services/assets.ts';
import { formatTimestamp } from '../../services/format.ts';
import StatIcon, { type StatIconName } from './StatIcon.tsx';
import type { SnapshotEvent } from '../../types/dataset.ts';

interface EventTimelineProps {
  events: SnapshotEvent[];
}

/** Event-type icon (shape conveys type; team conveys via tint + description). */
const EVENT_ICON: Record<SnapshotEvent['type'], StatIconName> = {
  champion_kill: 'kda',
  tower_kill: 'tower',
  inhibitor_kill: 'inhibitor',
  dragon: 'dragon',
  herald: 'herald',
};

/**
 * Assist suffix, only when present and not already in the description. Only
 * the leading label is localized — the champion names after it are dataset
 * values and are never translated.
 *
 * The `/assist/i` guard reads the dataset's own English description, which is
 * language-independent, so the suffix appears or not identically in both.
 */
function assistText(event: SnapshotEvent, label: string): string | null {
  if (
    event.type === 'champion_kill' &&
    event.assist_champions.length > 0 &&
    !/assist/i.test(event.description)
  ) {
    return `${label}: ${event.assist_champions.map(championDisplayName).join(', ')}`;
  }
  return null;
}

/**
 * Match event feed: all events, chronological, always visible — no collapsing,
 * filters, or "important events only". Each row has a time column, a
 * team-tinted event-type icon (team is also named in the description, so color
 * is never the only channel), the description, and assists as secondary text.
 * Single column at every width so the sequence stays unambiguous.
 */
export default function EventTimeline({ events }: EventTimelineProps) {
  const snapshotContent = useContent().snapshot;

  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-400">{snapshotContent.noEventsLabel}</p>
    );
  }

  const sorted = [...events].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return (
    <ul className="divide-y divide-abyss-800">
      {sorted.map((event, index) => {
        const assists = assistText(event, snapshotContent.assistsLabel);
        return (
          <li key={index} className="flex items-start gap-2.5 py-1 text-sm">
            <span className="w-10 shrink-0 pt-px text-right font-mono text-xs tabular-nums text-slate-400">
              {formatTimestamp(event.timestamp_ms)}
            </span>
            <StatIcon
              name={EVENT_ICON[event.type]}
              size={15}
              className={`mt-0.5 shrink-0 ${
                event.team === 'blue' ? 'text-blue-400' : 'text-red-400'
              }`}
            />
            <span className="min-w-0">
              <span className="text-slate-300">{event.description}</span>
              {assists && (
                <span className="text-xs text-slate-400"> · {assists}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
