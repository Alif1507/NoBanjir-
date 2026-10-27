const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function photoExtension(mime: string, size: number) {
  return size > 0 && size <= MAX_PHOTO_BYTES ? types[mime] ?? null : null;
}

export function validPhotoBytes(mime: string, bytes: Uint8Array) {
  if (mime === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value,index) => bytes[index] === value);
  if (mime === "image/webp") return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  return false;
}
