import fs from 'node:fs';
import assert from 'node:assert/strict';
import { walk } from './files.mjs';

const rules = [
  [/docs\/[\w-]+\.(pdf|jpe?g|png|docx)/i, 'private document reference'],
  [/previews\//i, 'ticket preview reference'],
  // Only the shared confirmations folder (src/data/privateFolder.ts); Drive sharing protects it.
  [/drive\.google\.com\/drive\/folders\/(?!DEMO_FOLDER_ID)/i, 'unexpected Drive folder'],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, 'email address'],
  [/מספר הזמנה\s*[:#]?\s*[A-Za-z0-9-]{4,}/, 'booking number'],
  [/[?&](?:token|access_token|auth|signature)=[^&\s"']+/i, 'tokenized link'],
  [/data:image\//i, 'embedded image payload'],
];
// The app ships no images at all (icons are inline SVG), so any photo or document file is a mistake.
const files = ['src', 'dist', 'dist-web'].filter((dir) => fs.existsSync(dir)).flatMap(walk);
for (const file of files) {
  assert.ok(!/\.(pdf|docx|jpe?g|png|webp|gif|heic)$/i.test(file), `Unreviewed binary: ${file}`);
  if (!/\.(tsx?|json|css|js|html|svg)$/i.test(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const [pattern, label] of rules) assert.ok(!pattern.test(content), `${label} in ${file}`);
}
console.log(
  `PASS: ${files.length} source/build files checked for private document paths, personal emails, booking labels and tokenized links. Manual privacy review remains required before publication.`,
);
