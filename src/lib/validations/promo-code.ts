import { z } from "zod";

export const promoCodeSchema = z
  .object({
    code: z
      .string()
      .min(3, "Минимум 3 символа")
      .max(24, "Максимум 24 символа")
      .transform((v) => v.trim().toUpperCase()),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: z.coerce.number().positive("Укажите размер скидки"),
    maxUses: z.coerce.number().int().positive().nullish(),
    expiresAt: z.coerce.date().nullish(),
    active: z.boolean(),
  })
  .refine((v) => v.discountType !== "PERCENT" || v.discountValue <= 100, {
    message: "Процентная скидка не может быть больше 100",
    path: ["discountValue"],
  });

export type PromoCodeInput = z.infer<typeof promoCodeSchema>;
