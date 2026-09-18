import { z } from "zod";
import { newPasswordField } from "@/lib/validations/auth";

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
