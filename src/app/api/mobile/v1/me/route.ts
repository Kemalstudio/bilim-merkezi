import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { fail, invalid, ok, readJson, withMobileUser } from "@/lib/mobile/http";
import { loadMe } from "@/lib/mobile/auth-flows";

export const GET = withMobileUser(async ({ user, ctx: { t } }) => {
  const me = await loadMe(user.id);
  return me ? ok(me) : fail(t.errors.signInRequired, 401, "unauthorized");
});

const profileSchema = z.object({
  name: z.string({ error: "nameShort" }).trim().min(2, "nameShort").max(80, "nameLong"),
});

/** The parent's display name; contacts and password are changed on the website's settings page. */
export const PATCH = withMobileUser(async ({ request, user, ctx: { t } }) => {
  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  await logAction(user.id, "profile.updated", "user", user.id, { via: "app" });
  return ok(await loadMe(user.id));
});
