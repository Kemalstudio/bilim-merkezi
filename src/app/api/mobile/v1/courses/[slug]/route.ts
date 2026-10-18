import { getCourseDetail } from "@/lib/mobile/data";
import { getPaymentSettings } from "@/lib/site-settings";
import { fail, ok, publicRoute } from "@/lib/mobile/http";

export const GET = publicRoute<{ slug: string }>(async ({ params, ctx: { t } }) => {
  const [course, payments] = await Promise.all([getCourseDetail(params.slug), getPaymentSettings()]);
  // paymentsEnabled: false while the centre tests — the app then enrolls without a payment page.
  return course ? ok({ ...course, paymentsEnabled: payments.enabled }) : fail(t.errors.courseNotFound, 404, "not_found");
});
