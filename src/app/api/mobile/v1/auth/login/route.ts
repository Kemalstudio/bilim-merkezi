import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { isDeletedEmail } from "@/lib/account";
import { credentialsSchema } from "@/lib/validations/auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";
import { issueSession } from "@/lib/mobile/auth-flows";

/** Email or phone + password, with the same rules and limits as the website's sign-in. */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`login:${ip}`, 10, 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const parsed = credentialsSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);

  const login = parsed.data.login;
  const account = "email" in login ? login.email : login.phone;
  if (!(await rateLimit(`login-account:${account}`, 10, 15 * 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const user = await prisma.user.findUnique({ where: login, select: { id: true, email: true, passwordHash: true } });
  const valid = Boolean(user?.passwordHash) && (await bcrypt.compare(parsed.data.password, user!.passwordHash!));
  if (!user || !valid || isDeletedEmail(user.email)) return fail(t.errors.invalidCredentials, 401, "invalid_credentials");

  return ok(await issueSession(user.id, request, "password"));
});
