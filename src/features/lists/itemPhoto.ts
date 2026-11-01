import { uploadPhoto } from '../../lib/liveEdit';

/** The photo a form will save: the one it had (by id), a new one not saved yet, or none. */
export type PhotoChoice = { id: string } | { blob: Blob } | null;

/** The photo's id to save with the item, saving a new one first; '' for none. */
export async function savePhoto(choice: PhotoChoice): Promise<string> {
  if (!choice) return '';
  return 'id' in choice ? choice.id : uploadPhoto(choice.blob);
}
