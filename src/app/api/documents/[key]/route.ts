import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  // Reject anything but a bare filename we generated ourselves — blocks path traversal.
  if (!/^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(key)) {
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

  const stored = await getStorage().get(`documents/${key}`);
  if (!stored) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      "Content-Type": stored.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${key}"`,
    },
  });
}
