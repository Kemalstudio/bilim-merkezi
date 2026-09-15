import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { LottieIcon } from "@/components/shared/lottie-icon";

export const metadata: Metadata = { title: "Оплата прошла успешно" };

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {/* Plays once and stops on the finished check, before the file's own fade-out. */}
      <LottieIcon src="/lottie/success.json" trigger="once" playTo={0.7} className="h-28 w-28" />
      <h1 className="font-display text-2xl font-bold text-ink">Оплата прошла успешно!</h1>
      <p className="text-muted">
        Курс уже доступен в разделе «Мои курсы». Обычно это занимает всего несколько секунд.
      </p>
      <Button asChild size="lg">
        <Link href="/account/enrollments">Перейти к моим курсам</Link>
      </Button>
    </div>
  );
}
