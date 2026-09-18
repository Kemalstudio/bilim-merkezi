import { z } from "zod";

// Messages are keys of `errors` in src/lib/i18n/ui — actions turn them into the visitor's language.

/** What the parent types in step two; name and birth date come from the child's profile. */
export const enrollmentDocumentSchema = z.object({
  patronymic: z.string().trim().max(80).optional(),
  documentNumber: z
    .string({ error: "documentNumber" })
    .trim()
    .min(3, "documentNumber")
    .max(40, "documentNumberLong"),
  // A key issued by /api/uploads/enrollment-document; anything else is not ours.
  documentFile: z
    .string({ error: "documentFile" })
    .regex(/^[a-f0-9-]{36}\.(pdf|png|jpg|webp)$/i, "documentFile"),
});

export type EnrollmentDocumentInput = z.infer<typeof enrollmentDocumentSchema>;
