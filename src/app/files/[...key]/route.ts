import { NextResponse } from "next/server";
import { getStorage, isValidKey, PUBLIC_NAMESPACES, type Namespace } from "@/lib/storage";

/**
 * Public uploads (course covers, library files) when they are kept in the database or an S3
 * bucket. Enrollment documents are never served here — see /api/documents/[key].
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const namespace = key.split("/")[0] as Namespace;
  if (!isValidKey(key) || !PUBLIC_NAMESPACES.includes(namespace)) {
    return new NextResponse(null, { status: 404 });
  }

  const stored = await getStorage().get(key);
  if (!stored) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      "Content-Type": stored.contentType,
      // Keys are random and never reused, so the file behind a URL never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(namespace === "library" ? { "Content-Disposition": "attachment" } : {}),
    },
  });
}
