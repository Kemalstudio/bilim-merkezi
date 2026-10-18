import { rateLimit } from "@/lib/rate-limit";
import { receiveUpload } from "@/lib/uploads";
import { saveUpload } from "@/lib/storage";
import { fail, ok, withMobileUser } from "@/lib/mobile/http";

// Same rules as the website's /api/uploads/enrollment-document: the scan of a birth certificate
// or ID goes to the private "documents" namespace, never to a public URL.
const DOCUMENT_TYPES = ["pdf", "png", "jpg", "webp"] as const;

export const POST = withMobileUser(async ({ request, user, ctx: { t } }) => {
  if (!(await rateLimit(`document-upload:${user.id}`, 10, 10 * 60_000)).success) {
    return fail(t.errors.uploadTooMany, 429);
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
  return ok({ key: file }, 201);
});
