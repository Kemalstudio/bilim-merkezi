import { rateLimit } from "@/lib/rate-limit";
import { isMailSimulated } from "@/lib/mail";
import { requestEmailReset } from "@/lib/password-reset";
import { emailField } from "@/lib/validations/auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";

/** Emails a "set a new password" link; the answer is the same whether or not the address is registered. */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`reset-email:${ip}`, 5, 60_000)).success) return fail(t.errors.tooManyRequests, 429);

  const parsed = emailField.safeParse((await readJson(request)).email);
  if (!parsed.success) return invalid(t, parsed.error.issues);

  const outcome = await requestEmailReset(t, parsed.data);
  if (outcome === "rate-limited") return fail(t.errors.tooManyRequests, 429);
  if (outcome === "mail-failed") return fail(t.errors.mailUnavailable, 503, "mail_unavailable");
  return ok({ email: parsed.data, simulated: isMailSimulated });
});
