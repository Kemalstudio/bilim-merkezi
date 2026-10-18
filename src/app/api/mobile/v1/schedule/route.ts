import { getSchedule } from "@/lib/mobile/data";
import { ok, withMobileUser } from "@/lib/mobile/http";

/** Lessons of the parent's active courses, from now to ?days= ahead (default 30, at most 120). */
export const GET = withMobileUser(async ({ request, user }) => {
  const asked = Number(new URL(request.url).searchParams.get("days"));
  const days = Number.isFinite(asked) && asked > 0 ? Math.min(Math.round(asked), 120) : 30;
  return ok(await getSchedule(user.id, days));
});
