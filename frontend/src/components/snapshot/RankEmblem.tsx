import { useState } from 'react';
import { rankEmblemUrl } from '../../services/assets.ts';
import type { QueueRank } from '../../types/dataset.ts';

interface RankEmblemProps {
  /** The queue this row shows; null when the player has no entry there. */
  queueRank: QueueRank | null;
}

/**
 * Official Riot ranked-tier emblem, shown beside the rank text it repeats.
 *
 * Decorative (`alt=""`, aria-hidden): the adjacent visible text already names
 * the tier, so announcing it twice would be noise — the same convention
 * StatIcon uses for icons paired with a visible label.
 *
 * Renders nothing when there is no emblem to show (unranked, unavailable,
 * unrecognized tier) or when the image fails to load, so the rank text is never
 * replaced by a broken-image placeholder. Every tier gets the identical box,
 * spacing, and opacity — no tier-based sizing, glow, border, or background.
 *
 * Hidden below `sm`, where MatchupSection stacks the two cards and the rank
 * text already wraps to fill the row: the emblem only repeats the tier that
 * text states, so dropping it costs no experimental information while keeping
 * the two queue rows compact on a phone. The rank text is the actual input —
 * losing any of it would show the participant less than the LLM receives from
 * the same snapshot — so the emblem is what gives way.
 */
export default function RankEmblem({ queueRank }: RankEmblemProps) {
  const [failed, setFailed] = useState(false);

  const url = rankEmblemUrl(queueRank);
  if (!url || failed) return null;

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="hidden h-8 w-8 shrink-0 object-contain sm:block"
    />
  );
}
