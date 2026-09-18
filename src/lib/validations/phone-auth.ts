import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { OTP_LENGTH } from "@/lib/otp-constants";
import { newPasswordField } from "@/lib/validations/auth";

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

const nameField = z.string().trim().min(2, "nameShort").max(80, "nameLong");

export const requestOtpSchema = z.object({
  phone: phoneField,
  name: nameField.optional(),
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  code: otpCodeField,
  name: nameField.optional(),
});

export const resetPasswordSchema = z
  .object({
    phone: phoneField,
    code: otpCodeField,
    password: newPasswordField,
    confirmPassword: z.string({ error: "passwordMismatch" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });
