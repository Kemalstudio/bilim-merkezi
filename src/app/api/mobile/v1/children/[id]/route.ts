import { getChildDetail } from "@/lib/children-data";
import { deleteChild, updateChild } from "@/lib/children-service";
import { childSchema } from "@/lib/validations/child";
import { fail, invalid, ok, readJson, withMobileUser } from "@/lib/mobile/http";

type Params = { id: string };

/** One child with scores, courses and upcoming lessons; a child of another parent is a 404. */
export const GET = withMobileUser<Params>(async ({ user, params, ctx: { t } }) => {
  const child = await getChildDetail(params.id, user.id);
  return child ? ok(child) : fail(t.errors.childNotFound, 404, "not_found");
});

export const PATCH = withMobileUser<Params>(async ({ request, user, params, ctx: { t } }) => {
  const parsed = childSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);

  const updated = await updateChild(user.id, params.id, parsed.data);
  if ("error" in updated) return fail(t.errors[updated.error], 404, updated.error);
  return ok(updated);
});

export const DELETE = withMobileUser<Params>(async ({ user, params, ctx: { t } }) => {
  const deleted = await deleteChild(user.id, params.id);
  if ("error" in deleted) {
    return fail(t.errors[deleted.error], deleted.error === "childNotFound" ? 404 : 409, deleted.error);
  }
  return ok(deleted);
});
