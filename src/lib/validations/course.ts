import { z } from "zod";

export const lessonSchema = z.object({
  title: z.string().trim().min(2, "Название урока: минимум 2 символа"),
  durationMin: z.coerce.number().int().positive("Укажите длительность урока").max(600, "Урок не может длиться больше 10 часов"),
  topics: z.array(z.string().trim().min(1)).max(10, "Не больше 10 тем в одном уроке").default([]),
});

/** A module is one week of the programme. */
export const moduleSchema = z.object({
  title: z.string().trim().min(2, "Тема недели: минимум 2 символа"),
  goal: z.string().trim().max(200, "Итог недели: максимум 200 символов").optional(),
  lessons: z.array(lessonSchema).min(1, "Добавьте хотя бы один урок"),
});

export const courseSchema = z
  .object({
    title: z.string().min(3, "Минимум 3 символа"),
    summary: z.string().min(10, "Минимум 10 символов").max(220, "Максимум 220 символов"),
    description: z.string().min(30, "Минимум 30 символов"),
    level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    lessonsPerWeek: z.coerce.number().int().min(1, "Минимум 1 урок в неделю").max(7, "Максимум 7 уроков в неделю"),
    weeklyHoursMin: z.coerce.number().int().min(1, "Часов в неделю: минимум 1").max(60, "Часов в неделю: максимум 60"),
    weeklyHoursMax: z.coerce.number().int().min(1, "Часов в неделю: минимум 1").max(60, "Часов в неделю: максимум 60"),
    startDate: z.coerce.date().nullish(),
    price: z.coerce.number().nonnegative("Цена не может быть отрицательной"),
    discountPrice: z.coerce.number().nonnegative().nullish(),
    categoryId: z.string().min(1, "Выберите категорию"),
    instructorName: z.string().min(2, "Укажите имя преподавателя"),
    instructorTitle: z.string().optional(),
    instructorBio: z.string().optional(),
    coverImage: z.string().optional(),
    published: z.boolean(),
    featured: z.boolean(),
    modules: z.array(moduleSchema).min(1, "Добавьте хотя бы одну неделю программы"),
  })
  .superRefine((course, ctx) => {
    if (course.weeklyHoursMax < course.weeklyHoursMin) {
      ctx.addIssue({ code: "custom", path: ["weeklyHoursMax"], message: "Верхняя граница часов в неделю меньше нижней" });
    }
    // Every week follows the course's weekly format.
    course.modules.forEach((week, index) => {
      if (week.lessons.length !== course.lessonsPerWeek) {
        ctx.addIssue({
          code: "custom",
          path: ["modules", index, "lessons"],
          message: `Неделя ${index + 1}: должно быть ${course.lessonsPerWeek} ур. — сейчас ${week.lessons.length}`,
        });
      }
    });
  });

export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
