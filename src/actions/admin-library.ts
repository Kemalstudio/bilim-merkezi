"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAction } from "@/lib/audit";
import { libraryResourceSchema } from "@/lib/validations/library";

export type LibraryResourceActionState = { error?: string; success?: boolean } | undefined;

function parseLibraryForm(formData: FormData) {
  return libraryResourceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    fileUrl: formData.get("fileUrl"),
    fileType: formData.get("fileType"),
    fileSizeKb: formData.get("fileSizeKb") || undefined,
    courseId: formData.get("courseId") || null,
    published: formData.get("published") === "on",
  });
}

export async function createLibraryResourceAction(
  _prev: LibraryResourceActionState,
  formData: FormData
): Promise<LibraryResourceActionState> {
  const admin = await requireRole("ADMIN", "MODERATOR");
  const parsed = parseLibraryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля формы" };
  }

  const resource = await prisma.libraryResource.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      fileUrl: parsed.data.fileUrl,
      fileType: parsed.data.fileType,
      fileSizeKb: parsed.data.fileSizeKb ?? null,
      courseId: parsed.data.courseId || null,
      published: parsed.data.published,
    },
  });

  await logAction(admin.id, "libraryResource.created", "libraryResource", resource.id, { title: resource.title });
  revalidatePath("/admin/library");
  revalidatePath("/library");
  return { success: true };
}

export async function toggleLibraryResourcePublishedAction(id: string, published: boolean) {
  const admin = await requireRole("ADMIN", "MODERATOR");
  await prisma.libraryResource.update({ where: { id }, data: { published } });
  await logAction(
    admin.id,
    published ? "libraryResource.published" : "libraryResource.unpublished",
    "libraryResource",
    id
  );
  revalidatePath("/admin/library");
  revalidatePath("/library");
}

export async function deleteLibraryResourceAction(id: string) {
  const admin = await requireRole("ADMIN", "MODERATOR");
  await prisma.libraryResource.delete({ where: { id } });
  await logAction(admin.id, "libraryResource.deleted", "libraryResource", id);
  revalidatePath("/admin/library");
  revalidatePath("/library");
}
