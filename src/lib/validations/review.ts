import { z } from "zod";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.coerce.number({ error: "ratingRequired" }).int().min(1, "ratingRequired").max(5, "ratingRequired"),
  comment: z.string().trim().max(1000, "commentLong").optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
