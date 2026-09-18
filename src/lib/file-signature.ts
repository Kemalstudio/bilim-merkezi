/**
 * Upload type detection from the file's own bytes.
 *
 * The browser-supplied MIME type and file name are both chosen by the client, so neither
 * may decide what we store or how it is later served: a file named "x.html" sent as
 * "image/png" would otherwise land in /public and run as a page on our origin. The stored
 * extension always comes from this table, never from the upload.
 */

export type DetectedType = { ext: string; mime: string };

type Signature = DetectedType & { test: (bytes: Uint8Array) => boolean };

const startsWith = (bytes: Uint8Array, prefix: number[], offset = 0) =>
  bytes.length >= offset + prefix.length && prefix.every((byte, index) => bytes[offset + index] === byte);

const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

const SIGNATURES: Signature[] = [
  { ext: "png", mime: "image/png", test: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  { ext: "jpg", mime: "image/jpeg", test: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  { ext: "gif", mime: "image/gif", test: (b) => startsWith(b, ascii("GIF87a")) || startsWith(b, ascii("GIF89a")) },
  {
    ext: "webp",
    mime: "image/webp",
    test: (b) => startsWith(b, ascii("RIFF")) && startsWith(b, ascii("WEBP"), 8),
  },
  { ext: "pdf", mime: "application/pdf", test: (b) => startsWith(b, ascii("%PDF-")) },
  // Office Open XML documents are zip archives; the caller decides which of the two it wanted.
  { ext: "zip", mime: "application/zip", test: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
  // Legacy .doc (OLE compound file).
  {
    ext: "doc",
    mime: "application/msword",
    test: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
];

export function detectFileType(bytes: Uint8Array): DetectedType | null {
  const match = SIGNATURES.find((signature) => signature.test(bytes));
  return match ? { ext: match.ext, mime: match.mime } : null;
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Detects the type and checks it against `allowed` (a list of extensions). A zip that the
 * client declared as .docx is kept as .docx, since both share one signature.
 */
export function detectAllowedType(
  bytes: Uint8Array,
  allowed: readonly string[],
  declared: { name: string; type: string }
): DetectedType | null {
  const detected = detectFileType(bytes);
  if (!detected) return null;

  if (detected.ext === "zip" && allowed.includes("docx")) {
    const looksLikeDocx = declared.type === DOCX_MIME || declared.name.toLowerCase().endsWith(".docx");
    if (looksLikeDocx) return { ext: "docx", mime: DOCX_MIME };
  }
  return allowed.includes(detected.ext) ? detected : null;
}

/** Content types for files we serve back; anything else is sent as a download. */
export const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  zip: "application/zip",
  doc: "application/msword",
  docx: DOCX_MIME,
};
