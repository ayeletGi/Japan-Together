import fs from 'node:fs';
import path from 'node:path';

/** Every file under a folder, with its path. */
export function walk(folder) {
  return fs
    .readdirSync(folder, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)],
    );
}
