import { ok, withMobileUser } from "@/lib/mobile/http";
import { revokeMobileSession } from "@/lib/mobile/session";

/** Ends this phone's session; other devices stay signed in. */
export const POST = withMobileUser(async ({ user }) => {
  await revokeMobileSession(user.sessionId);
  return ok({ ok: true });
});
