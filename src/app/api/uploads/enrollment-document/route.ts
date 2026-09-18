import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { receiveUpload } from "@/lib/uploads";
import { saveUpload } from "@/lib/storage";
import { getI18n } from "@/lib/i18n/server";

// Enrollment documents (birth certificates, IDs) are sensitive: they go to the private
// "documents" namespace and are served only through /api/documents/[key], gated on ownership
// or staff role — never by a guessable public URL.
const DOCUMENT_TYPES = ["pdf", "png", "jpg", "webp"] as const;

export async function POST(request: Request) {
  const [session, { t }] = await Promise.all([auth(), getI18n()]);
  if (!session?.user) {
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  // Any signed-in parent can upload, so storage use is capped per account.
  if (!(await rateLimit(`document-upload:${session.user.id}`, 10, 10 * 60_000)).success) {
    return NextResponse.json({ error: t.errors.uploadTooMany }, { status: 429 });
  }

  const upload = await receiveUpload(request, {
    allowed: DOCUMENT_TYPES,
    maxBytes: 8 * 1024 * 1024,
    typeError: t.errors.uploadDocumentType,
    sizeError: t.errors.uploadDocumentSize,
    missingError: t.errors.uploadMissing,
  });
  if (!upload.ok) return upload.response;

  const { file } = await saveUpload("documents", upload.file.bytes, upload.file.type.ext, upload.file.type.mime);
  return NextResponse.json({ key: file });
}
