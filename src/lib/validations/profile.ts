import { z } from "zod";
import { emailField, newPasswordField, otpCodeField, phoneField } from "@/lib/validations/auth";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

export const updateProfileSchema = z.object({
  name: z.string({ error: "nameShort" }).trim().min(2, "nameShort").max(80, "nameLong"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: "currentPasswordRequired" }).min(1, "currentPasswordRequired"),
    newPassword: newPasswordField,
    confirmNewPassword: z.string({ error: "passwordMismatch" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "passwordMismatch",
    path: ["confirmNewPassword"],
  });

/** Email is optional on the account; an empty field means "no email", never an error. */
export const changeEmailSchema = z.object({
  email: emailField,
  currentPassword: z.string().optional(),
});

export const requestPhoneChangeSchema = z.object({ phone: phoneField });

export const confirmPhoneChangeSchema = z.object({
  phone: phoneField,
  code: otpCodeField,
  currentPassword: z.string().optional(),
});

/** First password on a phone or Google account. The SMS code is checked in the action. */
export const setPasswordSchema = z
  .object({
    newPassword: newPasswordField,
    confirmNewPassword: z.string({ error: "passwordMismatch" }),
    code: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "passwordMismatch",
    path: ["confirmNewPassword"],
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().optional(),
  code: z.string().optional(),
  confirm: z.literal("on", { error: "confirmRequired" }),
});
