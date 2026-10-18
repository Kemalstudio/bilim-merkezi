import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyOtp } from "@/lib/otp";
import { formatPhone, placeholderEmail } from "@/lib/phone";
import { verifyOtpSchema } from "@/lib/validations/phone-auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";
import { issueSession } from "@/lib/mobile/auth-flows";

/** Redeems the SMS code: signs in, creating the account on first use like the website does. */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`otp-verify:${ip}`, 10, 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const body = await readJson(request);
  const parsed = verifyOtpSchema.safeParse({
    phone: body.phone,
    code: body.code,
    name: typeof body.name === "string" && body.name.trim() ? body.name : undefined,
  });
  if (!parsed.success) return invalid(t, parsed.error.issues);
  const { phone, code, name } = parsed.data;

  const verified = await verifyOtp(phone, "LOGIN", code);
  if (!verified.ok) {
    return fail(verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid, 400, "code_invalid");
  }

  const user =
    (await prisma.user.findUnique({ where: { phone }, select: { id: true } })) ??
    (await prisma.user.create({
      // A phone-only account gets the internal placeholder email, replaceable in settings.
      data: { phone, name: name ?? formatPhone(phone), email: placeholderEmail(phone) },
      select: { id: true },
    }));
  return ok(await issueSession(user.id, request, "sms"));
});
