"use server";

import { revalidatePath } from "next/cache";
import { createChild, deleteChild, updateChild } from "@/lib/children-service";
import { requireUser } from "@/lib/rbac";
import { childSchema } from "@/lib/validations/child";
import { getI18n } from "@/lib/i18n/server";
import { issueText } from "@/lib/i18n/ui";

export type ChildActionState = { error?: string; success?: boolean; childId?: string } | undefined;

function parseChildForm(formData: FormData) {
  return childSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    birthDate: formData.get("birthDate"),
    grade: formData.get("grade") ?? undefined,
    notes: (formData.get("notes") as string | null)?.trim() || null,
  });
}

export async function createChildAction(
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  const created = await createChild(user.id, parsed.data);
  if ("error" in created) return { error: t.errors[created.error] };

  revalidatePath("/account");
  revalidatePath("/account/children");
  return { success: true, childId: created.id };
}

export async function updateChildAction(
  childId: string,
  _prev: ChildActionState,
  formData: FormData
): Promise<ChildActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  const parsed = parseChildForm(formData);
  if (!parsed.success) {
    return { error: issueText(t, parsed.error.issues) };
  }

  const updated = await updateChild(user.id, childId, parsed.data);
  if ("error" in updated) return { error: t.errors[updated.error] };

  revalidatePath("/account");
  revalidatePath("/account/children");
  revalidatePath(`/account/children/${childId}`);
  return { success: true, childId };
}

export async function deleteChildAction(childId: string): Promise<ChildActionState> {
  const user = await requireUser();
  const { t } = await getI18n();
  const deleted = await deleteChild(user.id, childId);
  if ("error" in deleted) return { error: t.errors[deleted.error] };

  revalidatePath("/account");
  revalidatePath("/account/children");
  return { success: true };
}
