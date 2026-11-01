/**
 * A photo from the phone's camera or gallery, made small enough to save and to keep offline:
 * at most 1280 px on its long side, as a JPEG of about 100–300 KB.
 */
const LONG_SIDE = 1280;
const MAX_BYTES = 400 * 1024;

export async function shrinkPhoto(file: Blob): Promise<Blob> {
  // `from-image` turns a sideways phone photo the right way up.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no canvas');
  // A see-through PNG would turn black as a JPEG.
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (blob && (blob.size <= MAX_BYTES || quality === 0.4)) return blob;
  }
  throw new Error('could not shrink the photo');
}
