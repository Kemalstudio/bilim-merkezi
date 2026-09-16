import { z } from "zod";

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Поставьте оценку").max(5),
  comment: z.string().max(1000, "Максимум 1000 символов").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
