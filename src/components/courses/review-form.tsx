"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createReviewAction } from "@/actions/reviews";
import { StarRatingInput } from "@/components/courses/star-rating-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ReviewForm({ courseId, hasReviewed }: { courseId: string; hasReviewed: boolean }) {
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
      toast.success("Спасибо за отзыв!");
      formRef.current?.reset();
    }
  }, [isPending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <div>
        <p className="mb-2 text-sm font-semibold text-ink-soft">Ваша оценка</p>
        <StarRatingInput name="rating" />
      </div>
      <Textarea name="comment" placeholder="Поделитесь впечатлением о курсе (необязательно)" rows={3} />
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Отправка..." : hasReviewed ? "Обновить отзыв" : "Оставить отзыв"}
      </Button>
    </form>
  );
}
