/**
 * Shared text-hierarchy tokens (Tailwind v4 utility strings) so labels stop
 * being defined ad hoc across the dashboard. There is one middle tier for
 * section headings and metric/column labels, readable supporting text, and a
 * single very-small uppercase style reserved for nonessential eyebrows only.
 *
 * Lives in its own module (no components) so React Fast Refresh stays happy.
 */
export const text = {
  /** Section titles and other middle-tier headings. */
  sectionHeading: 'text-sm font-semibold text-slate-200',
  /** Metric / column labels: the recognizable middle-small tier. */
  metricLabel:
    'text-[11px] font-semibold uppercase tracking-wide text-slate-400',
  /** Nonessential eyebrow labels only (e.g. the game-state tag). */
  eyebrow: 'text-[10px] font-medium uppercase tracking-widest text-slate-500',
  /** Readable supporting text: progress context, delta explanation, helpers. */
  helper: 'text-xs text-slate-400',
  /** Truly secondary metadata. */
  mutedMeta: 'text-xs text-slate-500',
} as const;
