/**
 * The claude.ai artifact runtime (`window.claude.use`). It exists only inside the artifact viewer;
 * the saved offline copy and the dev server have none, so every caller must work without it.
 */

type Runtime = { use(name: string): Promise<unknown> };

/** Resolves the capability's namespace, or null when this view cannot run it. */
export async function loadCapability<T>(name: string): Promise<T | null> {
  const claude = (window as { claude?: Runtime }).claude;
  if (!claude) return null;
  try {
    return ((await claude.use(name)) as T | null) ?? null;
  } catch {
    return null;
  }
}
