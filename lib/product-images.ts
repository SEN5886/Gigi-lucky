export const UPLOAD_NAME = /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/;

export function extensionForImage(bytes: Uint8Array, mime: string): "jpg" | "png" | "webp" | "gif" | null {
  if (bytes.length < 12) return null;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const gif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  const webp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (jpeg && mime === "image/jpeg") return "jpg";
  if (png && mime === "image/png") return "png";
  if (gif && (mime === "image/gif")) return "gif";
  if (webp && mime === "image/webp") return "webp";
  return null;
}

export function uploadPathFor(name: string): string | null {
  if (!UPLOAD_NAME.test(name)) return null;
  return `/uploads/products/${name}`;
}
