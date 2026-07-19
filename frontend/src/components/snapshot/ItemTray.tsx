import ItemIcon from './ItemIcon.tsx';
import { snapshotContent } from '../../content.ts';
import type { ItemEntry } from '../../types/dataset.ts';

interface ItemTrayProps {
  inventory: ItemEntry[];
  version: string;
  /**
   * Alignment of the tray for mirrored player cards. `right` only takes effect
   * from `sm` up: below it the cards stack and both sides align left, matching
   * the rest of PlayerCard.
   */
  align?: 'left' | 'right';
}

/**
 * A player's build tray: item icons in dataset order (never re-sorted), each
 * with its ×N stack badge and accessible name/gold. Empty inventories render
 * muted placeholder slots so the panel stays visually stable.
 */
export default function ItemTray({
  inventory,
  version,
  align = 'left',
}: ItemTrayProps) {
  const justify =
    align === 'right' ? 'justify-start sm:justify-end' : 'justify-start';

  if (inventory.length === 0) {
    return (
      <div className={`flex flex-wrap gap-1 ${justify}`}>
        <span className="sr-only">{snapshotContent.noItemsLabel}</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="block h-7 w-7 rounded border border-dashed border-abyss-700"
          />
        ))}
      </div>
    );
  }

  return (
    <ul className={`flex flex-wrap gap-1 ${justify}`}>
      {inventory.map((item, index) => (
        <li key={`${item.item_id}-${index}`}>
          <ItemIcon item={item} version={version} />
        </li>
      ))}
    </ul>
  );
}
