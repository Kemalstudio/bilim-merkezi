import type { Metadata } from "next";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.metaTitle, robots: { index: false, follow: false } };
}

/**
 * Where Stripe sends a parent who paid from the mobile app. The browser there is not signed in,
 * so nothing is confirmed here: the app asks the API itself when it comes back to the front.
 */
export default async function AppPaymentPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, { t }] = await Promise.all([searchParams, getI18n()]);
  const paid = status === "success";
  const Icon = paid ? CircleCheck : CircleX;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full ${paid ? "bg-emerald/15 text-emerald" : "bg-amber/15 text-amber"}`}
      >
        <Icon aria-hidden className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-bold text-ink">
        {paid ? t.checkout.appSuccessTitle : t.checkout.appCancelledTitle}
      </h1>
      <p className="text-sm text-muted">{paid ? t.checkout.appSuccessText : t.checkout.appCancelledText}</p>
      <Button asChild className="mt-2 w-full">
        <a href={`bilimmerkezi://payment?status=${paid ? "success" : "cancelled"}`}>{t.checkout.backToApp}</a>
      </Button>
    </div>
  );
}
