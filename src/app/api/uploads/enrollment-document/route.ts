import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";

// Stored outside `public/` — enrollment documents (birth certificates, IDs)
// are sensitive and must never be reachable by a guessable public URL.
// They're served only through /api/documents/[key], gated on ownership or admin role.
const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), "private-uploads", "enrollment-documents");

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Допустимы изображения или PDF" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Максимальный размер файла — 8 МБ" }, { status: 400 });
  }

  await mkdir(PRIVATE_UPLOADS_DIR, { recursive: true });

  const ext = file.type === "application/pdf" ? "pdf" : file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(PRIVATE_UPLOADS_DIR, key), bytes);

  return NextResponse.json({ key });
}
