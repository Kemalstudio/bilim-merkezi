import { z } from "zod";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

const currentYear = new Date().getFullYear();

export const childSchema = z.object({
  firstName: z.string({ error: "nameShort" }).trim().min(2, "nameShort").max(60, "nameLong"),
  lastName: z.string({ error: "lastNameShort" }).trim().min(2, "lastNameShort").max(60, "nameLong"),
  birthDate: z
    .string({ error: "birthDateRequired" })
    .min(1, "birthDateRequired")
    .transform((value, ctx) => {
      const date = new Date(value);
      const year = date.getFullYear();
      if (Number.isNaN(date.getTime()) || year < currentYear - 25 || date > new Date()) {
        ctx.addIssue({ code: "custom", message: "birthDateInvalid" });
        return z.NEVER;
      }
      return date;
    }),
  grade: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((value, ctx) => {
      if (value === undefined || value === "" || value === null) return null;
      const grade = Number(value);
      if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
        ctx.addIssue({ code: "custom", message: "gradeInvalid" });
        return z.NEVER;
      }
      return grade;
    }),
  notes: z.string().trim().max(500, "notesLong").optional().nullable(),
});

export type ChildInput = z.infer<typeof childSchema>;
