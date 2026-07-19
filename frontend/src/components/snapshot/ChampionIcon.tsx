import { useState } from 'react';
import {
  championIconUrl,
  championDisplayName,
  championInitials,
} from '../../services/assets.ts';

interface ChampionIconProps {
  championId: string;
  version: string;
  /** Tailwind size classes, e.g. "h-12 w-12". */
  sizeClass: string;
}

/**
 * Champion portrait with a neutral fallback (initials block) when the image
 * fails to load. The visible champion name is rendered by the parent — this
 * component only guarantees no broken-image icon ever appears.
 */
export default function ChampionIcon({
  championId,
  version,
  sizeClass,
}: ChampionIconProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden="true"
        className={`${sizeClass} flex shrink-0 items-center justify-center rounded bg-abyss-800 text-sm font-medium text-slate-400`}
      >
        {championInitials(championId)}
      </div>
    );
  }

  return (
    <img
      src={championIconUrl(version, championId)}
      alt={championDisplayName(championId)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${sizeClass} shrink-0 rounded`}
    />
  );
}
