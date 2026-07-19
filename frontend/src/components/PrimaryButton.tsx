import type { ReactNode } from 'react';

interface PrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}

/** Large, touch-friendly primary action button (dark-theme neutral). */
export default function PrimaryButton({
  onClick,
  disabled = false,
  children,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-slate-100 px-6 py-3 text-base font-medium text-abyss-950 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-abyss-700 disabled:text-slate-500 sm:w-auto"
    >
      {children}
    </button>
  );
}
