import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { registerWithEmailSchema } from "@/lib/validations/auth";
import { fail, invalid, ok, publicRoute, readJson } from "@/lib/mobile/http";
import { issueSession } from "@/lib/mobile/auth-flows";

/** Email + password sign-up with no code, as on the website; phone parents sign up by SMS. */
export const POST = publicRoute(async ({ request, ctx: { t, ip } }) => {
  if (!(await rateLimit(`register:${ip}`, 5, 60_000)).success) return fail(t.errors.tooManyAttempts, 429);

  const parsed = registerWithEmailSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(t, parsed.error.issues);
  const { name, email, password } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return fail(t.errors.emailTaken, 409, "email_taken");
  }
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  return ok(await issueSession(user.id, request, "register"), 201);
});
