/**
 * Supplies the active language to the tree.
 *
 * Mounted ABOVE <App/>, so a language change re-renders the survey without
 * remounting it: App owns consent, profile answers, the selected cases, the
 * current question index, the response ID and the submission state, and none
 * of that is keyed by, derived from, or reset by the language. Switching
 * language is a pure re-render — no effect refetches, no case is reselected,
 * and no request is made.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CONTENT } from '../content/index.ts';
import { LanguageContext, type LanguageContextValue } from './context.ts';
import {
  resolveInitialLanguage,
  saveLanguage,
  type Language,
} from './language.ts';

export default function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  // Resolved once, lazily, so the very first paint is already in the right
  // language and the value never changes underneath a render.
  const [language, setLanguageState] = useState<Language>(
    resolveInitialLanguage
  );

  const content = CONTENT[language];

  // Keeps assistive tech, browser translation prompts and hyphenation in sync
  // with what is actually on screen. The document title is participant-visible
  // (tab strip, bookmarks), so it follows too.
  useEffect(() => {
    document.documentElement.lang = content.htmlLang;
    document.title = content.documentTitle;
  }, [content]);

  // Only an explicit choice is persisted; a detected language is never written
  // back, so storage always means "the participant picked this".
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, content }),
    [language, setLanguage, content]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
