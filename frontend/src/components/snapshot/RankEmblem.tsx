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
 * Hidden below `sm`: a lane column is only ~125px at 320px wide, and two queue
 * rows with emblems would leave too little room for the queue label, tier, LP
 * and W/L. The rank text is the actual experimental input — losing any of it
 * would show the participant less than the LLM receives from the same snapshot
 * — while the emblem only repeats the tier the text already states, so the
 * emblem is what gives way.
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
