import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

// Stored and compared in lower case, so "Name@Mail.com" and "name@mail.com" are one account.
const emailField = z
  .string({ error: "emailInvalid" })
  .trim()
  .toLowerCase()
  .pipe(z.email("emailInvalid"));

// bcrypt ignores everything past 72 bytes, so longer passwords would be silently truncated.
export const newPasswordField = z
  .string({ error: "passwordShort" })
  .min(8, "passwordShort")
  .max(72, "passwordLong");

const passwordField = z.string({ error: "passwordRequired" }).min(1, "passwordRequired");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

/**
 * Password sign-in accepts an email or a phone number: parents who signed up by phone and
 * then set a password (via SMS recovery) have no real email to type.
 */
export const loginIdentifier = z
  .string({ error: "loginRequired" })
  .trim()
  .min(1, "loginRequired")
  .transform((value, ctx): { email: string } | { phone: string } => {
    if (value.includes("@")) {
      const email = z.email().safeParse(value.toLowerCase());
      if (email.success) return { email: email.data };
      ctx.addIssue({ code: "custom", message: "emailInvalid" });
      return z.NEVER;
    }
    const phone = normalizePhone(value);
    if (phone) return { phone };
    ctx.addIssue({ code: "custom", message: "loginInvalid" });
    return z.NEVER;
  });

export const credentialsSchema = z.object({
  login: loginIdentifier,
  password: passwordField,
});

export const registerSchema = z
  .object({
    name: z.string({ error: "nameShort" }).trim().min(2, "nameShort").max(80, "nameLong"),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string({ error: "passwordMismatch" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
