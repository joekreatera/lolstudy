import { useState } from 'react';
import { itemIconUrl } from '../../services/assets.ts';
import { useContent } from '../../i18n/context.ts';
import type { ItemEntry } from '../../types/dataset.ts';

interface ItemIconProps {
  item: ItemEntry;
  version: string;
}

/**
 * One inventory entry: item icon with an optional ×N count badge. Name and
 * gold are provided as accessible text (alt/title); a failed image becomes a
 * neutral gray block, never a broken-image icon.
 */
export default function ItemIcon({ item, version }: ItemIconProps) {
  const snapshotContent = useContent().snapshot;
  const [failed, setFailed] = useState(false);

  // `item.name` is a dataset value and is never translated; only the gold
  // suffix around it is. Grouping stays en-US so the figure reads identically
  // to every other number in the snapshot.
  const label =
    `${item.name} (${item.gold_total.toLocaleString('en-US')} ` +
    `${snapshotContent.itemGoldSuffix})`;

  return (
    <span className="relative inline-block" title={label}>
      {failed ? (
        <span
          role="img"
          aria-label={label}
          className="block h-7 w-7 rounded border border-abyss-700 bg-abyss-800"
        />
      ) : (
        <img
          src={itemIconUrl(version, item.item_id)}
          alt={label}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-7 w-7 rounded"
        />
      )}
      {item.count > 1 && (
        <span className="absolute -right-1 -bottom-1 rounded bg-abyss-950 px-0.5 text-[10px] leading-tight text-white">
          ×{item.count}
        </span>
      )}
    </span>
  );
}
