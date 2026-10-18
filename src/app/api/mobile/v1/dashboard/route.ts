import { getChildrenForParent } from "@/lib/children-data";
import { getEnrollments, getFeed, getSchedule } from "@/lib/mobile/data";
import { loadMe } from "@/lib/mobile/auth-flows";
import { fail, ok, withMobileUser } from "@/lib/mobile/http";

/** Everything the home screen shows, in one round trip. */
export const GET = withMobileUser(async ({ user, ctx: { t } }) => {
  const [me, children, upcoming, enrollments, feed] = await Promise.all([
    loadMe(user.id),
    getChildrenForParent(user.id),
    getSchedule(user.id, 30, 6),
    getEnrollments(user.id),
    getFeed(user.id, 8),
  ]);
  if (!me) return fail(t.errors.signInRequired, 401, "unauthorized");

  return ok({
    me,
    children,
    upcoming,
    enrollments: enrollments.slice(0, 5),
    feed,
    stats: {
      children: children.length,
      activeCourses: enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length,
      awaitingPayment: enrollments.filter((enrollment) => enrollment.status === "PENDING").length,
    },
  });
});
