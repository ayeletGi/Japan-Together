import { liveChanges } from './live';

/**
 * A Google Drive folder per trip day for our photos, inside the shared folder. Access is controlled
 * by Drive sharing. A day without a folder shows no photos button. Folders made during the trip go
 * to the live database (`photoFolders`, see `live.ts`).
 */
export const DAY_PHOTO_FOLDERS: Partial<Record<string, string>> = {};

export function photoFolderFor(date: string): string | undefined {
  return liveChanges().photoFolders[date]?.url ?? DAY_PHOTO_FOLDERS[date];
}
