import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receiveUpload } from "@/lib/uploads";
import { saveUpload } from "@/lib/storage";
import { processAvatar } from "@/lib/avatar-image";

// SVG is deliberately absent: it can carry script and these files are served from our origin.
const IMAGE_TYPES = ["png", "jpg", "gif", "webp"] as const;

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "MODERATOR")) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const upload = await receiveUpload(request, {
    allowed: IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
    typeError: "Допустимы изображения PNG, JPG, GIF или WebP",
    sizeError: "Максимальный размер файла — 5 МБ",
    missingError: "Файл не найден",
  });
  if (!upload.ok) return upload.response;

  // ?kind=avatar is a teacher's portrait: cropped square and re-encoded, like a profile photo.
  if (new URL(request.url).searchParams.get("kind") === "avatar") {
    try {
      const portrait = await processAvatar(upload.file.bytes);
      const { url } = await saveUpload("avatars", portrait, "webp", "image/webp");
      return NextResponse.json({ url });
    } catch {
      return NextResponse.json({ error: "Не удалось обработать изображение" }, { status: 400 });
    }
  }

  const { url } = await saveUpload("covers", upload.file.bytes, upload.file.type.ext, upload.file.type.mime);
  return NextResponse.json({ url });
}
