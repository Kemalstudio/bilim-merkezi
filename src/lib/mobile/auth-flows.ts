import "server-only";

import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/audit";
import { isDeletedEmail } from "@/lib/account";
import { formatPhone, realEmail } from "@/lib/phone";
import { createMobileSession } from "@/lib/mobile/session";

/** What the app knows about the signed-in parent. */
export type MeDto = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  phoneFormatted: string | null;
  hasPassword: boolean;
  image: string | null;
  createdAt: string;
};

export async function loadMe(userId: string): Promise<MeDto | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, passwordHash: true, image: true, createdAt: true },
  });
  if (!user || isDeletedEmail(user.email)) return null;
  return {
    id: user.id,
    name: user.name,
    email: realEmail(user.email),
    phone: user.phone,
    phoneFormatted: user.phone ? formatPhone(user.phone) : null,
    hasPassword: Boolean(user.passwordHash),
    image: user.image,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Opens an app session for the account and answers the way every sign-in route does. */
export async function issueSession(userId: string, request: Request, method: "password" | "sms" | "register") {
  const device = request.headers.get("x-device") ?? request.headers.get("user-agent");
  const token = await createMobileSession(userId, device);
  // Feeds "recent sign-ins" in the account settings, next to the website's sign-ins.
  await logAction(userId, "auth.signin", "user", userId, { provider: `app-${method}`, device: device?.slice(0, 120) ?? null });
  return { token, me: (await loadMe(userId))! };
}
