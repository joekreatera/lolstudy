/**
 * Small, neutral inline-SVG icons for match statistics. No icon library is
 * added — there are fewer than ten, and Data Dragon has no standalone stat
 * icons. All use `currentColor` (muted by default via the parent's text color)
 * and are decorative: every icon is paired with a visible text label, so the
 * SVG itself is aria-hidden.
 */

export type StatIconName =
  | 'gold'
  | 'kda'
  | 'cs'
  | 'level'
  | 'tower'
  | 'dragon'
  | 'herald'
  | 'baron'
  | 'inhibitor';

interface StatIconProps {
  name: StatIconName;
  /** Pixel size (14–18 typical). */
  size?: number;
  className?: string;
}

const PATHS: Record<StatIconName, React.ReactNode> = {
  // Coin
  gold: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  // Crossed swords
  kda: (
    <>
      <path d="M4 4 L14 14" />
      <path d="M20 4 L10 14" />
      <path d="M6 18 L10 14" />
      <path d="M18 18 L14 14" />
    </>
  ),
  // Sword (creep score)
  cs: (
    <>
      <path d="M12 3 V14" />
      <path d="M8.5 14 H15.5" />
      <path d="M12 14 V21" />
    </>
  ),
  // Upward chevrons (progression)
  level: (
    <>
      <path d="M6 13 L12 7 L18 13" />
      <path d="M6 18 L12 12 L18 18" />
    </>
  ),
  // Turret
  tower: (
    <>
      <path d="M8 21 V10 a4 4 0 0 1 8 0 V21" />
      <path d="M6 21 H18" />
      <path d="M8.5 13.5 H15.5" />
    </>
  ),
  // Stylized wing
  dragon: (
    <>
      <path d="M3 14 Q8 5 12 11 Q16 5 21 14" />
      <path d="M12 11 V18" />
    </>
  ),
  // Eye
  herald: (
    <>
      <path d="M2 12 Q12 5 22 12 Q12 19 2 12 Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  // Fanged head
  baron: (
    <>
      <path d="M6 8 H18 V13 a6 6 0 0 1 -12 0 Z" />
      <path d="M9 18 l1 2.5 l1 -2.5" />
      <path d="M13 18 l1 2.5 l1 -2.5" />
    </>
  ),
  // Crystal
  inhibitor: (
    <>
      <path d="M12 3 L19 12 L12 21 L5 12 Z" />
      <path d="M12 3 V21" />
      <path d="M5 12 H19" />
    </>
  ),
};

export default function StatIcon({
  name,
  size = 16,
  className = '',
}: StatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
