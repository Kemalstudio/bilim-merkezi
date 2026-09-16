import { z } from "zod";

const currentYear = new Date().getFullYear();

export const childSchema = z.object({
  firstName: z.string().trim().min(2, "Имя должно содержать минимум 2 символа"),
  lastName: z.string().trim().min(2, "Фамилия должна содержать минимум 2 символа"),
  birthDate: z
    .string()
    .min(1, "Укажите дату рождения")
    .transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Некорректная дата рождения" });
        return z.NEVER;
      }
      const year = date.getFullYear();
      if (year < currentYear - 25 || date > new Date()) {
        ctx.addIssue({ code: "custom", message: "Проверьте дату рождения" });
        return z.NEVER;
      }
      return date;
    }),
  grade: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined || value === "" || value === null) return null;
      const grade = Number(value);
      if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
        ctx.addIssue({ code: "custom", message: "Класс — число от 1 до 12" });
        return z.NEVER;
      }
      return grade;
    }),
  notes: z.string().trim().max(500, "Не более 500 символов").optional().nullable(),
});

export type ChildInput = z.infer<typeof childSchema>;
