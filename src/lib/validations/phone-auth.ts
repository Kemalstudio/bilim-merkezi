import { z } from "zod";
import { newPasswordField, otpCodeField, phoneField } from "@/lib/validations/auth";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

export { otpCodeField, phoneField };

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
