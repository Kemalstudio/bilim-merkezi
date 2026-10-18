import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { issueOtp } from "@/lib/otp";
import { isSmsSimulated } from "@/lib/sms";
import { maskPhone } from "@/lib/phone";
import { tpl } from "@/lib/i18n/format";
import { requestOtpSchema } from "@/lib/validations/phone-auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";

/**
 * Texts a code for signing in (which also creates the account on first use) or, with
 * purpose "recovery", for setting a new password. Recovery never reveals whether the number
 * is registered; sign-in tells the app, so it can ask a newcomer's name.
 */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`otp-request:${ip}`, 5, 60_000)).success) return fail(t.errors.tooManyRequests, 429);

  const body = await readJson(request);
  const parsed = requestOtpSchema.safeParse({ phone: body.phone });
  if (!parsed.success) return invalid(t, parsed.error.issues);
  const { phone } = parsed.data;
  const recovery = body.purpose === "recovery";

  // Every SMS costs money, so one number gets at most a handful per hour whatever the source.
  if (!(await rateLimit(`otp-phone:${phone}`, 5, 60 * 60_000)).success) return fail(t.errors.tooManyRequests, 429);

  const account = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  const sent = { phone, maskedPhone: maskPhone(phone), simulated: isSmsSimulated };
  if (recovery && !account) return ok(sent);

  const text = recovery ? t.sms.recovery : account ? t.sms.login : t.sms.register;
  const issued = await issueOtp(phone, recovery ? "RECOVERY" : "LOGIN", text);
  if (!issued.ok) {
    if (issued.reason === "unavailable") return fail(t.errors.smsUnavailable, 503, "sms_unavailable");
    return fail(tpl(t.errors.codeCooldown, { seconds: issued.retryInSeconds }), 429, "cooldown");
  }
  return ok(recovery ? sent : { ...sent, isNew: !account });
});
