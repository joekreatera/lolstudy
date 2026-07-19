/**
 * Compact EN | ES toggle.
 *
 * A two-button group rather than a select: with exactly two options a dropdown
 * costs a tap to reveal what a pair of 24px targets can just show. Sized and
 * colored as secondary metadata (the `eyebrow`/`helper` tier used elsewhere) so
 * it reads as chrome, not as a survey control competing with Continue.
 *
 * The active option is marked with `aria-current="true"` and a filled surface,
 * so state is carried by more than color. Both buttons stay reachable by
 * keyboard with the same `focus-visible` ring the rest of the app uses.
 */

import { useLanguage } from '../i18n/context.ts';
import { LANGUAGES } from '../i18n/language.ts';

export default function LanguageSwitcher() {
  const { language, setLanguage, content } = useLanguage();

  return (
    <div
      role="group"
      aria-label={content.language.switcherLabel}
      className="inline-flex items-center overflow-hidden rounded-md border border-abyss-700"
    >
      {LANGUAGES.map((code, index) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            // The visible face is "EN"/"ES"; the accessible name is the full
            // language name so it is not read out as two letters.
            aria-label={content.language.names[code]}
            aria-current={active ? 'true' : undefined}
            className={`px-2 py-1 text-[11px] font-semibold tracking-widest uppercase focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none ${
              index > 0 ? 'border-l border-abyss-700' : ''
            } ${
              active
                ? 'bg-abyss-800 text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {content.language.short[code]}
          </button>
        );
      })}
    </div>
  );
}
