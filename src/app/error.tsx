"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/shared/status-screen";
import { useI18n } from "@/components/i18n-provider";
import { tpl } from "@/lib/i18n/format";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      title={t.statusError.title}
      description={`${t.statusError.text}${error.digest ? ` ${tpl(t.statusError.code, { digest: error.digest })}` : ""}`}
    >
      <Button size="lg" onClick={() => retry()}>
        <RefreshCw aria-hidden className="h-4 w-4" /> {t.common.retry}
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/contact">{t.common.contactUs}</Link>
      </Button>
    </StatusScreen>
  );
}
