/**
 * Language resolution for the survey shell.
 *
 * Resolution order is fixed: an explicitly saved choice wins, then browser
 * detection, then English. Detection is only consulted until the participant
 * picks a language themselves — a detected language is deliberately NOT
 * written back to storage, so `survey-language` always means "the participant
 * chose this", never "we guessed this once". A participant who never touches
 * the switcher keeps following their browser if it changes.
 *
 * Everything here is synchronous and side-effect free apart from the explicit
 * `saveLanguage`, so the first render can resolve the language without a
 * flash of the wrong copy.
 */

export type Language = 'en' | 'es';

export const LANGUAGES: readonly Language[] = ['en', 'es'];

export const STORAGE_KEY = 'survey-language';

/** Narrows arbitrary input (stored strings included) to a supported language. */
export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'es';
}

/**
 * The language a single locale tag asks for, or null if we do not support it.
 *
 * Any Spanish locale selects Spanish: `es`, `es-MX`, `es-ES`, `es-419`, …
 * Matched on the subtag boundary so a hypothetical `est`-style code cannot
 * false-positive.
 *
 * English is recognized explicitly rather than left to the fallback. It is not
 * redundant: the caller walks the preference list in order and stops at the
 * first tag it understands, so an English tag has to be able to STOP that walk.
 * Without this, a browser advertising ['en-US', 'es-MX'] — English first,
 * Spanish second — would skip past English and resolve to Spanish.
 */
function fromLocale(locale: string): Language | null {
  const normalized = locale.toLowerCase();
  if (normalized === 'es' || normalized.startsWith('es-')) return 'es';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  return null;
}

/**
 * The most-preferred supported language in an ordered locale list. Unsupported
 * tags are skipped, so ['fr-FR', 'es-MX'] still resolves to Spanish.
 *
 * Pure and exported so the preference-order rules can be verified without a
 * browser (see scripts/verify-results.mts).
 */
export function languageFromLocales(
  locales: readonly string[]
): Language | null {
  for (const candidate of locales) {
    const match = fromLocale(candidate);
    if (match) return match;
  }
  return null;
}

/**
 * The browser's own preference. `navigator.languages` is the ordered list;
 * `navigator.language` is the single-value fallback for browsers that do not
 * expose it.
 */
export function detectBrowserLanguage(): Language | null {
  if (typeof navigator === 'undefined') return null;
  return languageFromLocales([
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    ...(navigator.language ? [navigator.language] : []),
  ]);
}

/**
 * The saved choice, or null when absent or unusable. Storage access is guarded:
 * Safari private mode and blocked third-party storage make `localStorage`
 * throw on read, and a survey must not fail to render over a preference.
 */
export function readSavedLanguage(): Language | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Persists an explicit choice. Silently ignored when storage is unavailable. */
export function saveLanguage(language: Language): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* Preference is not persisted; the session still works. */
  }
}

/** Saved choice → browser detection → English. */
export function resolveInitialLanguage(): Language {
  return readSavedLanguage() ?? detectBrowserLanguage() ?? 'en';
}
