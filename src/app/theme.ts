import { loadJson } from '../lib/storage';

export type Theme = 'light' | 'dark';

/** Saved by `useLocalState('theme')`; null means "follow the phone". */
export const THEME_KEY = 'theme';
export const NO_THEME: Theme | null = null;

const systemTheme = (): Theme => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

/** The theme on screen: the saved choice, else the phone's setting. */
export const effectiveTheme = (saved: Theme | null): Theme => saved ?? systemTheme();

/** Puts the choice on <html> (tokens.css reads it); null removes it so the phone decides. */
export function applyTheme(saved: Theme | null) {
  const root = document.documentElement;
  if (saved) root.dataset.theme = saved;
  else delete root.dataset.theme;
}

/** Before the first render, so a saved dark theme doesn't flash light. */
export function applySavedTheme() {
  const saved = loadJson<unknown>(THEME_KEY);
  applyTheme(saved === 'light' || saved === 'dark' ? saved : null);
}
