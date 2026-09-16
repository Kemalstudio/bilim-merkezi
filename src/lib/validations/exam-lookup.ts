import { z } from "zod";

export const examLookupSchema = z.object({
  phone: z
    .string()
    .min(6, "Введите номер телефона")
    .max(25, "Слишком длинный номер")
    .regex(/^[0-9+()\s-]+$/, "Номер может содержать только цифры и + ( ) -"),
});
