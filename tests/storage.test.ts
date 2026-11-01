import { afterEach, describe, expect, it, vi } from 'vitest';
import { applySavedTheme } from '../src/app/theme';
import { isAbortError } from '../src/lib/net';
import { loadJson, removeJson, saveJson } from '../src/lib/storage';

/** A working localStorage, as a phone browser has. */
function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
}

/** Storage that throws on every call, as in private mode. */
const blocked = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

afterEach(() => vi.unstubAllGlobals());

describe('local storage helpers', () => {
  it('saves, reads back and forgets values under the app prefix', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(saveJson('yenRate', { ilsPerJpy: 0.024 })).toBe(true);
    expect(storage.items.get('japan-together.yenRate')).toBe('{"ilsPerJpy":0.024}');
    expect(loadJson('yenRate')).toEqual({ ilsPerJpy: 0.024 });
    expect(removeJson('yenRate')).toBe(true);
    expect(loadJson('yenRate')).toBeUndefined();
  });

  it('treats unreadable values and blocked storage as "nothing saved"', () => {
    const storage = memoryStorage();
    storage.items.set('japan-together.broken', '{not json');
    vi.stubGlobal('localStorage', storage);
    expect(loadJson('broken')).toBeUndefined();

    vi.stubGlobal('localStorage', blocked);
    expect(loadJson('theme')).toBeUndefined();
    expect(saveJson('theme', 'dark')).toBe(false);
    expect(removeJson('theme')).toBe(false);
  });
});

describe('saved theme', () => {
  const root = (): { dataset: Record<string, string> } => ({ dataset: {} });

  it('applies a saved light or dark choice and ignores anything else', () => {
    const storage = memoryStorage();
    const html = root();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('document', { documentElement: html });

    storage.items.set('japan-together.theme', '"dark"');
    applySavedTheme();
    expect(html.dataset.theme).toBe('dark');

    storage.items.set('japan-together.theme', '"purple"');
    applySavedTheme();
    expect(html.dataset.theme).toBeUndefined();
  });

  it('follows the phone when storage is blocked', () => {
    const html = root();
    vi.stubGlobal('localStorage', blocked);
    vi.stubGlobal('document', { documentElement: html });
    expect(() => applySavedTheme()).not.toThrow();
    expect(html.dataset.theme).toBeUndefined();
  });
});

describe('isAbortError', () => {
  it('recognises a cancelled fetch and nothing else', () => {
    expect(isAbortError(new DOMException('stop', 'AbortError'))).toBe(true);
    expect(isAbortError(new TypeError('Failed to fetch'))).toBe(false);
    expect(isAbortError(404)).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
