import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/status-screen";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFound() {
  return (
    <StatusScreen
      code="Ошибка 404"
      icon={Compass}
      title="Такой страницы нет"
      description="Возможно, ссылка устарела или курс сняли с публикации. Посмотрите актуальный каталог или вернитесь на главную."
    >
      <Button asChild size="lg">
        <Link href="/courses">Каталог курсов</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/">На главную</Link>
      </Button>
    </StatusScreen>
  );
}
