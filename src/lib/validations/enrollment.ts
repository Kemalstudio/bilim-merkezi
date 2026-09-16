import { z } from "zod";

export const enrollmentApplicationSchema = z.object({
  lastName: z.string().min(2, "Укажите фамилию"),
  firstName: z.string().min(2, "Укажите имя"),
  patronymic: z.string().optional(),
  birthDate: z.coerce.date({ error: "Укажите дату рождения" }),
  documentNumber: z.string().min(3, "Укажите номер документа"),
  documentFile: z.string().min(1, "Загрузите скан или фото документа"),
});

export type EnrollmentApplicationInput = z.infer<typeof enrollmentApplicationSchema>;
