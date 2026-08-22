/**
 * Downscales and re-encodes a photo as JPEG in the browser before it's
 * uploaded for scanning — receipt photos from a phone camera can be
 * several megabytes, and the model reads them just as well at a modest size.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export type CompressedImage = { base64: string; mimeType: string };

export async function compressImageForUpload(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Couldn't process that image."))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });

  return { base64: await blobToBase64(blob), mimeType: "image/jpeg" };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.readAsDataURL(blob);
  });
}
