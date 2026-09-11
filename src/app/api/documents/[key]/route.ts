import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), "private-uploads", "enrollment-documents");

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  // Reject anything but a bare filename we generated ourselves — blocks path traversal.
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(key)) {
    return NextResponse.json({ error: "Некорректный файл" }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "MODERATOR";
  if (!isStaff) {
    const application = await prisma.enrollmentApplication.findFirst({
      where: { documentFile: key, enrollment: { userId: session.user.id } },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }
  }

  try {
    const bytes = await readFile(path.join(PRIVATE_UPLOADS_DIR, key));
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
}
