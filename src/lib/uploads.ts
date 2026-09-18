import "server-only";

import { NextResponse } from "next/server";
import { detectAllowedType, type DetectedType } from "@/lib/file-signature";

type UploadRules = {
  /** Extensions accepted after sniffing the file's bytes. */
  allowed: readonly string[];
  maxBytes: number;
  typeError: string;
  sizeError: string;
  missingError: string;
};

export type ReceivedUpload = { bytes: Buffer; type: DetectedType; size: number };

/**
 * Reads the `file` field of a multipart request and checks it against `rules`.
 * Returns either the verified file or a ready 400 response.
 */
export async function receiveUpload(
  request: Request,
  rules: UploadRules
): Promise<{ ok: true; file: ReceivedUpload } | { ok: false; response: NextResponse }> {
  const fail = (error: string) => ({ ok: false as const, response: NextResponse.json({ error }, { status: 400 }) });

  // Refuse oversized bodies before buffering them, when the client says how big they are.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > rules.maxBytes + 64 * 1024) return fail(rules.sizeError);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail(rules.missingError);
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(rules.missingError);
  if (file.size > rules.maxBytes) return fail(rules.sizeError);

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = detectAllowedType(bytes, rules.allowed, { name: file.name, type: file.type });
  if (!type) return fail(rules.typeError);

  return { ok: true, file: { bytes, type, size: file.size } };
}
