import { getChildrenForParent } from "@/lib/children-data";
import { createChild } from "@/lib/children-service";
import { childSchema } from "@/lib/validations/child";
import { fail, invalid, ok, readJson, withMobileUser } from "@/lib/mobile/http";

export const GET = withMobileUser(async ({ user }) => ok(await getChildrenForParent(user.id)));

export const POST = withMobileUser(async ({ request, user, ctx: { t } }) => {
  const parsed = childSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);

  const created = await createChild(user.id, parsed.data);
  if ("error" in created) return fail(t.errors[created.error], 409, created.error);
  return ok(created, 201);
});
