import { z } from "zod";

export const scheduleEventSchema = z
  .object({
    courseId: z.string().min(1, "Выберите курс"),
    title: z.string().trim().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов"),
    startsAt: z.coerce.date({ error: "Укажите дату и время начала" }),
    endsAt: z.coerce.date().nullish(),
    location: z
      .string()
      .trim()
      .max(120, "Максимум 120 символов")
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine((v) => !v.endsAt || v.endsAt > v.startsAt, {
    message: "Время окончания должно быть позже начала",
    path: ["endsAt"],
  });

export type ScheduleEventInput = z.infer<typeof scheduleEventSchema>;
