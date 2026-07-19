import type { ReactNode } from 'react';
import { useContent } from '../../i18n/context.ts';
import type { TeamSide } from '../../types/dataset.ts';

/** A dark dashboard panel with an optional compact section eyebrow. */
export function Panel({
  title,
  right,
  children,
  className = '',
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-abyss-700 bg-abyss-900 p-3 sm:p-4 ${className}`}
    >
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between">
          {title && (
            <h2 className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              {title}
            </h2>
          )}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Small colored dot marking a team (paired with text; never color-only). */
export function TeamDot({ side }: { side: TeamSide }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 rounded-full ${
        side === 'blue' ? 'bg-blue-400' : 'bg-red-400'
      }`}
    />
  );
}

/** Team name with its dot. `align` controls dot/label order for mirroring. */
export function TeamTag({
  side,
  align = 'left',
}: {
  side: TeamSide;
  align?: 'left' | 'right';
}) {
  const snapshotContent = useContent().snapshot;
  const label =
    side === 'blue'
      ? snapshotContent.blueTeamLabel
      : snapshotContent.redTeamLabel;
  const dot = <TeamDot side={side} />;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200">
      {align === 'left' ? (
        <>
          {dot}
          {label}
        </>
      ) : (
        <>
          {label}
          {dot}
        </>
      )}
    </span>
  );
}
