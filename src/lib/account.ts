/**
 * Small pieces of account logic shared by the settings page, its actions and the session.
 * Nothing here touches the database or the request, so it is safe on the client too.
 */

/** A deleted account keeps its row (payments and audit entries point at it) under this address. */
export const DELETED_EMAIL_DOMAIN = "deleted.bilim.local";

export const deletedEmail = (userId: string) => `${userId}@${DELETED_EMAIL_DOMAIN}`;

export const isDeletedEmail = (email: string | null | undefined) => Boolean(email?.endsWith(`@${DELETED_EMAIL_DOMAIN}`));

export type SignInMethod = "sms" | "password" | "google";

/** How this person can get into the account, for the summary at the top of the settings. */
export function signInMethods(user: { phone: string | null; passwordHash: string | null; hasGoogle: boolean }): SignInMethod[] {
  const methods: SignInMethod[] = [];
  if (user.phone) methods.push("sms");
  if (user.passwordHash) methods.push("password");
  if (user.hasGoogle) methods.push("google");
  return methods;
}
