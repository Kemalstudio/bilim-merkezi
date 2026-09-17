"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/status-screen";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      title="Что-то пошло не так"
      description={`Мы не смогли загрузить страницу. Попробуйте ещё раз — если ошибка повторится, напишите нам${
        error.digest ? ` и укажите код ${error.digest}` : ""
      }.`}
    >
      <Button size="lg" onClick={() => retry()}>
        <RefreshCw aria-hidden className="h-4 w-4" /> Попробовать снова
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/contact">Связаться с нами</Link>
      </Button>
    </StatusScreen>
  );
}
