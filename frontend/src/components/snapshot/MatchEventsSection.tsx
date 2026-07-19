import { useEffect, useRef, useState } from 'react';
import KillMap from './KillMap.tsx';
import EventTimeline from './EventTimeline.tsx';
import { Panel } from './ui.tsx';
import { text } from './typography.ts';
import { snapshotContent } from '../../content.ts';
import { formatTimestamp } from '../../services/format.ts';
import type { SnapshotEvent } from '../../types/dataset.ts';

interface MatchEventsSectionProps {
  events: SnapshotEvent[];
  version: string;
  cutoffMinute: number;
}

function SubHeading({ children }: { children: string }) {
  return <h3 className={`mb-2 ${text.metricLabel}`}>{children}</h3>;
}

/**
 * Map and timeline framed as one "Match events" panel. On wide screens the kill
 * map sits beside the timeline; below that they stack (map first). Map and
 * timeline logic are unchanged — no filtering, sorting, or coordinate changes.
 *
 * Dense snapshots (up to 93 events) would otherwise produce a very tall page,
 * so the timeline lives in a bounded scroll region: a max-height only, so
 * sparse lists keep their natural height and never show an empty container.
 * Every event stays present and in order — nothing is filtered or collapsed.
 */
export default function MatchEventsSection({
  events,
  version,
  cutoffMinute,
}: MatchEventsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  // The overflow cue appears only when the list actually overflows.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [events]);

  // Derived only from the same list that is rendered below.
  const eventSummary = `${events.length} ${
    events.length === 1 ? 'event' : 'events'
  } through ${formatTimestamp(cutoffMinute * 60_000)}`;

  return (
    <Panel
      title={
        snapshotContent.killMapTitle +
        ' & ' +
        snapshotContent.eventTimelineTitle
      }
    >
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div>
          <SubHeading>{snapshotContent.killMapTitle}</SubHeading>
          <KillMap events={events} version={version} />
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className={text.metricLabel}>
              {snapshotContent.eventTimelineTitle}
            </h3>
            <p className={text.helper}>{eventSummary}</p>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              tabIndex={0}
              role="group"
              aria-label={`${snapshotContent.eventTimelineTitle}: ${eventSummary}`}
              className="max-h-[60vh] overflow-y-auto pr-1 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none lg:max-h-[26rem]"
            >
              <EventTimeline events={events} />
            </div>
            {overflowing && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-abyss-900 to-transparent"
              />
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
