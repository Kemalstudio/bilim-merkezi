import { z } from "zod";

export const libraryResourceSchema = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  description: z.string().optional(),
  fileUrl: z.string().min(1, "Загрузите файл"),
  fileType: z.string().min(1),
  fileSizeKb: z.coerce.number().int().nonnegative().nullish(),
  courseId: z.string().nullish(),
  published: z.boolean(),
});

export type LibraryResourceInput = z.infer<typeof libraryResourceSchema>;
