/**
 * The language context object and its hooks.
 *
 * Deliberately free of components so React Fast Refresh (and the
 * `react-refresh/only-export-components` lint rule) stays happy — the provider
 * lives in `LanguageProvider.tsx`.
 */

import { createContext, useContext } from 'react';
import { CONTENT, type ContentBundle } from '../content/index.ts';
import type { Language } from './language.ts';

export interface LanguageContextValue {
  language: Language;
  /** Records an explicit participant choice and persists it. */
  setLanguage: (language: Language) => void;
  /** Copy for the active language. */
  content: ContentBundle;
}

/**
 * Defaults to English so a component rendered outside the provider (a test, a
 * future story) still renders real copy instead of throwing. `setLanguage` is
 * a no-op there rather than a silent lie about persistence.
 */
export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => undefined,
  content: CONTENT.en,
});

/** Active language plus the setter, for the switcher. */
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Just the copy — what almost every component needs. */
export function useContent(): ContentBundle {
  return useContext(LanguageContext).content;
}
