import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { quotePrice } from "@/lib/enrollment-service";
import { fail, ok, readJson, withMobileUser } from "@/lib/mobile/http";

const promoSchema = z.object({ courseId: z.string().min(1), code: z.string().trim().min(1).max(40) });

/** What the parent would pay for the course with this promo code, before enrolling. */
export const POST = withMobileUser(async ({ request, user, ctx: { t } }) => {
  // Limited per account, so the endpoint cannot be used to guess codes.
  if (!(await rateLimit(`promo-check:${user.id}`, 15, 10 * 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const parsed = promoSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(t.errors.promoInvalid, 400, "promoInvalid");

  const course = await prisma.course.findFirst({
    where: { id: parsed.data.courseId, published: true },
    select: { price: true, discountPrice: true },
  });
  if (!course) return fail(t.errors.courseNotFound, 404, "courseNotFound");

  const quote = await quotePrice(course, parsed.data.code);
  if ("error" in quote) return fail(t.errors.promoInvalid, 400, "promoInvalid");
  return ok({ code: parsed.data.code.toUpperCase(), price: quote.price, fullPrice: Number(course.discountPrice ?? course.price) });
});
