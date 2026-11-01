/** Whether a failed fetch was cancelled on purpose (the screen moved on), not a network error. */
export const isAbortError = (error: unknown): boolean =>
  (error as { name?: string } | null)?.name === 'AbortError';
