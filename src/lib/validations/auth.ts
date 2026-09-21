import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { OTP_LENGTH } from "@/lib/otp-constants";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

/** Accepts any typed format and hands downstream code a normalised number. */
export const phoneField = z
  .string({ error: "phoneRequired" })
  .min(1, "phoneRequired")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "phoneInvalid" });
      return z.NEVER;
    }
    return normalized;
  });

// String.raw keeps "\d" intact; in a plain template literal it collapses to "d" and the
// pattern would only ever match "dddddd".
const OTP_PATTERN = new RegExp(String.raw`^\d{${OTP_LENGTH}}$`);

export const otpCodeField = z.string({ error: "codeFormat" }).trim().regex(OTP_PATTERN, "codeFormat");

// Stored and compared in lower case, so "Name@Mail.com" and "name@mail.com" are one account.
export const emailField = z
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

/**
 * Registration needs a phone number, confirmed by SMS before the account exists. Email is
 * optional: many parents have none, and a blank field means "no email", not an error.
 */
export const registerSchema = z
  .object({
    name: z.string({ error: "nameShort" }).trim().min(2, "nameShort").max(80, "nameLong"),
    phone: phoneField,
    email: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), emailField.optional()),
    password: newPasswordField,
    confirmPassword: z.string({ error: "passwordMismatch" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

/** The second registration step: the same details plus the code from the SMS. */
export const confirmRegistrationSchema = registerSchema.and(z.object({ code: otpCodeField }));

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
