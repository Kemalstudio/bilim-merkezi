import { NextResponse } from "next/server";
import sharp from "sharp";
import { auth, updateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { receiveUpload } from "@/lib/uploads";
import { saveUpload } from "@/lib/storage";
import { logAction } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// SVG is deliberately absent: it can carry script and these files are served from our origin.
const IMAGE_TYPES = ["png", "jpg", "gif", "webp"] as const;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
/** Avatars are shown at most ~128 px wide; 512 keeps them sharp on dense screens. */
const AVATAR_SIZE = 512;

const noStore = { "Cache-Control": "no-store" };

/**
 * A signed-in user uploads their own profile photo. The image is re-encoded here — square-cropped,
 * scaled down, converted to WebP and stripped of EXIF (which can hold GPS coordinates) — so what
 * we serve is never the raw file from the visitor.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  const limit = await rateLimit(`avatar:${session.user.id}`, 10, 60 * 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429, headers: noStore });
  }

  const upload = await receiveUpload(request, {
    allowed: IMAGE_TYPES,
    maxBytes: MAX_INPUT_BYTES,
    typeError: "PNG, JPG, GIF or WebP images only",
    sizeError: "The photo must be smaller than 8 MB",
    missingError: "No file received",
  });
  if (!upload.ok) return upload.response;

  let bytes: Buffer;
  try {
    bytes = await sharp(upload.file.bytes, { limitInputPixels: 40_000_000 })
      .rotate() // apply the camera's orientation before EXIF is dropped
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 86 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "This image could not be processed" }, { status: 400, headers: noStore });
  }

  const { url } = await saveUpload("avatars", bytes, "webp", "image/webp");
  await prisma.user.update({ where: { id: session.user.id }, data: { image: url } });
  await logAction(session.user.id, "profile.avatar_changed", "user", session.user.id);
  await updateSession({ user: { image: url } });

  return NextResponse.json({ url }, { headers: noStore });
}

/** Removes the photo; the avatar falls back to the initials. */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });

  // Same-origin check for a state-changing request that carries no body to inspect.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
  await logAction(session.user.id, "profile.avatar_removed", "user", session.user.id);
  await updateSession({ user: { image: null } });

  return NextResponse.json({ url: null }, { headers: noStore });
}
