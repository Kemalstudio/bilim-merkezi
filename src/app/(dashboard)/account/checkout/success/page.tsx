import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Оплата прошла успешно" };

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10">
        <CheckCircle2 className="h-8 w-8 text-emerald" />
      </span>
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
