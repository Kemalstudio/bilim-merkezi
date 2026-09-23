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

/** A list typed one item per line in the admin form. */
const lineList = (max: number, label: string) =>
  z.array(z.string().trim().min(1).max(160, `${label}: пункт длиннее 160 символов`)).max(max, `${label}: не больше ${max} пунктов`);

const optionalInt = (min: number, max: number, label: string) =>
  z.coerce.number().int().min(min, `${label}: минимум ${min}`).max(max, `${label}: максимум ${max}`).nullish();

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
    // Prices are whole manat (TMT).
    price: z.coerce.number().int("Цена в манатах — целое число").min(0, "Цена не может быть отрицательной").max(1_000_000, "Слишком большая цена"),
    discountPrice: z.coerce.number().int("Цена в манатах — целое число").min(0).max(1_000_000).nullish(),
    categoryId: z.string().min(1, "Выберите категорию"),
    instructorName: z.string().min(2, "Укажите имя преподавателя"),
    instructorTitle: z.string().optional(),
    instructorBio: z.string().optional(),
    instructorAvatar: z
      .string()
      .regex(/^\/(uploads\/avatars|files\/avatars|instructors)\/[\w-]+\.(png|jpe?g|gif|webp)$/i, "Загрузите фото через форму")
      .optional(),
    coverImage: z
      .string()
      .regex(/^\/(uploads|files\/covers)\/[\w-]+\.(png|jpe?g|gif|webp)$/i, "Загрузите обложку через форму")
      .optional(),
    published: z.boolean(),
    featured: z.boolean(),
    outcomes: lineList(12, "Чему научится"),
    skills: lineList(15, "Навыки"),
    requirements: lineList(10, "Требования"),
    audience: lineList(10, "Для кого курс"),
    ageMin: optionalInt(3, 18, "Возраст от"),
    ageMax: optionalInt(3, 18, "Возраст до"),
    groupSize: optionalInt(1, 50, "Размер группы"),
    teachingLanguage: z.string().trim().max(80).optional(),
    certificate: z.boolean(),
    track: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]*$/, "Линейка курсов: только латиница, цифры и дефис")
      .optional(),
    levelCode: z.string().trim().max(8).optional(),
    modules: z.array(moduleSchema).min(1, "Добавьте хотя бы одну неделю программы"),
  })
  .superRefine((course, ctx) => {
    if (course.weeklyHoursMax < course.weeklyHoursMin) {
      ctx.addIssue({ code: "custom", path: ["weeklyHoursMax"], message: "Верхняя граница часов в неделю меньше нижней" });
    }
    // The site shows and charges the discount price whenever it is set, so it must be lower.
    if (course.discountPrice != null && course.discountPrice >= course.price) {
      ctx.addIssue({ code: "custom", path: ["discountPrice"], message: "Цена со скидкой должна быть ниже обычной цены" });
    }
    if (course.ageMin != null && course.ageMax != null && course.ageMax < course.ageMin) {
      ctx.addIssue({ code: "custom", path: ["ageMax"], message: "Возраст «до» меньше возраста «от»" });
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
