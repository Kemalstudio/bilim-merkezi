import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { receiveUpload } from "@/lib/uploads";
import { saveUpload } from "@/lib/storage";

const LIBRARY_TYPES = ["pdf", "doc", "docx", "zip", "png", "jpg"] as const;

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "MODERATOR")) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const upload = await receiveUpload(request, {
    allowed: LIBRARY_TYPES,
    maxBytes: 25 * 1024 * 1024,
    typeError: "Допустимы PDF, DOC, DOCX, ZIP, PNG или JPG",
    sizeError: "Максимальный размер файла — 25 МБ",
    missingError: "Файл не найден",
  });
  if (!upload.ok) return upload.response;

  const { type, bytes, size } = upload.file;
  const { url } = await saveUpload("library", bytes, type.ext, type.mime);
  return NextResponse.json({ url, fileType: type.ext, fileSizeKb: Math.round(size / 1024) });
}
