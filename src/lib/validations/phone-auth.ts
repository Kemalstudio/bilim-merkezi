import { z } from "zod";
import { normalizePhone } from "@/lib/phone";
import { OTP_LENGTH } from "@/lib/otp-constants";

/** Accepts any typed format and hands downstream code a normalised number. */
export const phoneField = z
  .string()
  .min(1, "Введите номер телефона")
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Введите корректный номер телефона" });
      return z.NEVER;
    }
    return normalized;
  });

export const requestOtpSchema = z.object({
  phone: phoneField,
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").optional(),
});

export const verifyOtpSchema = z.object({
  phone: phoneField,
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\d{${OTP_LENGTH}}$`), `Код состоит из ${OTP_LENGTH} цифр`),
  name: z.string().trim().min(2, "Имя должно содержать минимум 2 символа").optional(),
});

export const resetPasswordSchema = z
  .object({
    phone: phoneField,
    code: z
      .string()
      .trim()
      .regex(new RegExp(`^\d{${OTP_LENGTH}}$`), `Код состоит из ${OTP_LENGTH} цифр`),
    password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });
