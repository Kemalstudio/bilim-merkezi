import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { name: string | null };
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">Пока нет отзывов. Станьте первым!</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-4 border-b border-border pb-6 last:border-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback>{initials(review.user.name ?? "?")}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-ink">{review.user.name}</p>
              <span className="shrink-0 text-xs text-muted">{formatDate(review.createdAt)}</span>
            </div>
            <div className="mt-1 flex gap-0.5 text-amber">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} />
              ))}
            </div>
            {review.comment && <p className="mt-2 text-sm text-ink-soft">{review.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
