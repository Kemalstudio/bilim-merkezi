import "server-only";

import sharp from "sharp";

/** Avatars are shown at most ~128 px wide; 512 keeps them sharp on dense screens. */
export const AVATAR_SIZE = 512;

/**
 * Turns whatever the visitor uploaded into the avatar we serve: square-cropped around the most
 * interesting part of the picture, scaled down, converted to WebP and stripped of EXIF (which can
 * hold GPS coordinates). Throws when the bytes are not an image sharp can read.
 */
export function processAvatar(bytes: Buffer) {
  return sharp(bytes, { limitInputPixels: 40_000_000 })
    .rotate() // apply the camera's orientation before EXIF is dropped
    .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
    .webp({ quality: 86 })
    .toBuffer();
}
