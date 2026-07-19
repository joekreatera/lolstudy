import ChampionIcon from './ChampionIcon.tsx';
import ItemTray from './ItemTray.tsx';
import RankEmblem from './RankEmblem.tsx';
import { text } from './typography.ts';
import { snapshotContent } from '../../content.ts';
import { championDisplayName } from '../../services/assets.ts';
import {
  formatNumber,
  formatQueueLabel,
  formatQueueRecord,
  formatQueueStanding,
  type QueueKey,
} from '../../services/format.ts';
import type { ParticipantState, TeamSide } from '../../types/dataset.ts';

/** Fixed row order: Solo/Duo always first, Flex always second. */
const RANK_QUEUES: readonly QueueKey[] = ['solo_duo', 'flex'];

interface PlayerCardProps {
  player: ParticipantState | undefined;
  version: string;
  side: TeamSide;
}

/**
 * One player in a lane matchup: framed champion portrait with an integrated
 * level badge, champion name, prominent K/D/A, gold/CS stat cluster, and a
 * build tray. Mirrored by side (Blue content flows left→right, Red right→left)
 * with identical dimensions. Champion image errors are handled by ChampionIcon.
 */
export default function PlayerCard({ player, version, side }: PlayerCardProps) {
  const isBlue = side === 'blue';
  const alignText = isBlue ? 'text-left' : 'text-right';

  if (!player) {
    if (import.meta.env.DEV) {
      console.warn(`PlayerCard: missing ${side} participant for a role`);
    }
    return (
      <div
        className={`flex min-h-24 items-center ${isBlue ? 'justify-start' : 'justify-end'} text-sm text-slate-500`}
      >
        {snapshotContent.playerUnavailableLabel}
      </div>
    );
  }

  const frameRing = isBlue ? 'ring-blue-400/40' : 'ring-red-400/40';

  const portrait = (
    <div className="relative shrink-0">
      <div className={`rounded-md ring-1 ${frameRing}`}>
        <ChampionIcon
          championId={player.champion}
          version={version}
          sizeClass="h-14 w-14"
        />
      </div>
      <span className="absolute -right-1 -bottom-1 rounded bg-abyss-950 px-1 text-[10px] leading-tight font-medium text-slate-100 ring-1 ring-abyss-700">
        {player.level}
      </span>
    </div>
  );

  const stats = (
    <div className={`min-w-0 flex-1 ${alignText}`}>
      <p className="truncate text-sm font-semibold text-slate-100">
        {championDisplayName(player.champion)}
      </p>
      <p className="text-sm font-semibold text-slate-100 tabular-nums">
        {player.kills} / {player.deaths} / {player.assists}
        <span className="sr-only"> kills, deaths, assists</span>
      </p>
      {/* Wraps rather than overflowing: Gold and CS together need ~122px, and
          a narrow card must be free to put CS on a second line instead of
          spilling the numbers outside the card and over the opposing side. */}
      <div
        className={`mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 ${
          isBlue ? 'justify-start' : 'justify-end'
        }`}
      >
        <span className="flex items-baseline gap-1">
          <span className={text.metricLabel}>Gold</span>
          <span className="text-sm font-semibold text-slate-100 tabular-nums">
            {formatNumber(player.gold)}
          </span>
        </span>
        <span className="flex items-baseline gap-1">
          <span className={text.metricLabel}>CS</span>
          <span className="text-sm font-semibold text-slate-100 tabular-nums">
            {formatNumber(player.cs)}
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div
        className={`flex items-start gap-2.5 ${isBlue ? '' : 'flex-row-reverse'}`}
      >
        {portrait}
        {stats}
      </div>
      {/* Rank: two full-width queue rows (Solo/Duo first, then Flex). The inner
          stats column is only ~70px at 320px wide, so rank spans the whole
          card. ONE shared markup path renders both queues and both teams — only
          the group's alignment mirrors, while the emblem stays left of the text
          and the box, spacing, type and opacity are identical for every tier.
          Text wraps rather than truncating: the standing and W/L are raw
          experimental input and must never be clipped. Every row reserves the
          emblem's height (min-h) so a row without an emblem — Unranked, or the
          whole lookup unavailable — is exactly as tall as a ranked one; without
          it, holding more ranked queues would silently make a card taller.
          Never colored, compared, or aggregated. */}
      <div className="mt-1 space-y-0.5">
        {RANK_QUEUES.map((queue) => {
          const queueRank = player.rank.available ? player.rank[queue] : null;
          const record = formatQueueRecord(queueRank);
          return (
            <div
              key={queue}
              className={`flex min-h-5 items-center gap-1.5 sm:min-h-8 ${
                isBlue ? 'justify-start' : 'justify-end'
              }`}
            >
              <RankEmblem queueRank={queueRank} />
              <span
                className={`min-w-0 text-xs font-medium text-slate-300 sm:text-sm ${
                  isBlue ? 'text-left' : 'text-right'
                }`}
              >
                <span className="text-slate-400">
                  {formatQueueLabel(queue)}
                </span>{' '}
                <span className="tabular-nums">
                  {formatQueueStanding(player.rank, queue)}
                </span>
                {record && (
                  <>
                    {' '}
                    <span className="whitespace-nowrap tabular-nums">
                      {record}
                    </span>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2">
        <ItemTray
          inventory={player.items.inventory}
          version={version}
          align={isBlue ? 'left' : 'right'}
        />
      </div>
    </div>
  );
}
