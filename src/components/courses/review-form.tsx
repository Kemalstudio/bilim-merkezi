"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createReviewAction } from "@/actions/reviews";
import { StarRatingInput } from "@/components/courses/star-rating-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function ReviewForm({ courseId, hasReviewed }: { courseId: string; hasReviewed: boolean }) {
  const { t } = useI18n();
  const [state, formAction, isPending] = useActionState(createReviewAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      submittedRef.current = true;
      return;
    }
    if (!submittedRef.current) return;
    submittedRef.current = false;

    if (state?.error) {
      toast.error(state.error);
    } else {
      toast.success(t.reviews.thanksPending);
      formRef.current?.reset();
    }
  }, [isPending, state, t]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
      <input type="hidden" name="courseId" value={courseId} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-soft">{t.reviews.yourRating}</legend>
        <StarRatingInput name="rating" />
      </fieldset>
      <Textarea
        name="comment"
        aria-label={t.reviews.placeholder}
        placeholder={t.reviews.placeholder}
        rows={3}
        maxLength={1000}
      />
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? t.common.sending : hasReviewed ? t.reviews.update : t.reviews.submit}
      </Button>
    </form>
  );
}
