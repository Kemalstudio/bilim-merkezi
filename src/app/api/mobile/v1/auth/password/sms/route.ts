import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyOtp } from "@/lib/otp";
import { logAction } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validations/phone-auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";
import { issueSession } from "@/lib/mobile/auth-flows";

/** Phone recovery: the code from a "recovery" SMS plus a new password; signs the app in. */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`password-reset:${ip}`, 10, 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const parsed = resetPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);
  const { phone, code, password } = parsed.data;

  const verified = await verifyOtp(phone, "RECOVERY", code);
  if (!verified.ok) {
    return fail(verified.reason === "locked" ? t.errors.codeLocked : t.errors.codeInvalid, 400, "code_invalid");
  }

  const account = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
  if (!account) return fail(t.errors.accountNotFound, 404, "not_found");

  // Ends every session that signed in with the old password, on the website and in the app.
  await prisma.user.update({
    where: { id: account.id },
    data: { passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: new Date() },
  });
  await logAction(account.id, "auth.password_reset", "user", account.id, { via: "app-sms" });
  return ok(await issueSession(account.id, request, "sms"));
});
