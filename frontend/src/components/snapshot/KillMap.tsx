import { useState } from 'react';
import { useContent } from '../../i18n/context.ts';
import { minimapUrl } from '../../services/assets.ts';
import type { SnapshotEvent, KillEvent } from '../../types/dataset.ts';

interface KillMapProps {
  events: SnapshotEvent[];
  version: string;
}

/**
 * Champion-kill markers over the Summoner's Rift minimap. Supplementary view:
 * the complete kill record is in the (visible) event timeline, so the map
 * itself is aria-hidden. Blue kills = circles, Red kills = diamonds — shape
 * plus color, never color alone. No density/heat/region computation.
 */
export default function KillMap({ events, version }: KillMapProps) {
  const snapshotContent = useContent().snapshot;
  const [mapFailed, setMapFailed] = useState(false);

  const kills = events.filter(
    (e): e is KillEvent =>
      e.type === 'champion_kill' &&
      e.position_normalized != null &&
      typeof e.position_normalized.x === 'number' &&
      typeof e.position_normalized.y === 'number'
  );

  return (
    <div>
      <div
        aria-hidden="true"
        className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-lg border border-abyss-700"
      >
        {mapFailed ? (
          /* Neutral fallback: plain square with a diagonal river hint. */
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full bg-abyss-800"
          >
            <line
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              stroke="#cbd5e1"
              strokeWidth="6"
            />
          </svg>
        ) : (
          <img
            src={minimapUrl(version)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setMapFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {kills.map((kill, index) => {
            const cx = kill.position_normalized!.x * 100;
            // Riot's origin is bottom-left; SVG's is top-left → flip y.
            const cy = (1 - kill.position_normalized!.y) * 100;
            if (kill.team === 'blue') {
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={1.4}
                  fill="#3b82f6"
                  fillOpacity={0.7}
                  stroke="#ffffff"
                  strokeWidth={0.3}
                />
              );
            }
            return (
              <path
                key={index}
                d={`M ${cx} ${cy - 1.8} L ${cx + 1.8} ${cy} L ${cx} ${cy + 1.8} L ${cx - 1.8} ${cy} Z`}
                fill="#ef4444"
                fillOpacity={0.7}
                stroke="#ffffff"
                strokeWidth={0.3}
              />
            );
          })}
        </svg>
      </div>

      <p className="mt-2 text-center text-sm text-slate-400">
        <span className="text-blue-400">
          {snapshotContent.killMapLegendBlue}
        </span>
        <span className="mx-3" aria-hidden="true">
          ·
        </span>
        <span className="text-red-400">{snapshotContent.killMapLegendRed}</span>
      </p>
    </div>
  );
}
