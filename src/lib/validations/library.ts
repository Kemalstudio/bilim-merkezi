import { z } from "zod";

export const libraryResourceSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  description: z.string().optional(),
  // Only files uploaded through the admin form, or an https link to an external copy.
  fileUrl: z
    .string()
    .min(1, "Загрузите файл")
    .refine((url) => /^\/(uploads|files)\/library\/[\w-]+\.[a-z0-9]+$/i.test(url) || /^https:\/\//i.test(url), {
      message: "Некорректная ссылка на файл",
    }),
  fileType: z.string().min(1),
  fileSizeKb: z.coerce.number().int().nonnegative().nullish(),
  courseId: z.string().nullish(),
  published: z.boolean(),
});

export type LibraryResourceInput = z.infer<typeof libraryResourceSchema>;
