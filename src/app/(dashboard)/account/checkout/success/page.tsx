import Link from "next/link";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LottieIcon } from "@/components/shared/lottie-icon";
import { requireUser } from "@/lib/rbac";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession, type FulfillResult } from "@/lib/checkout";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.metaTitle };
}

/**
 * Stripe sends the parent here right after paying. The session is checked on the spot, so the
 * course is active even if the webhook is still on its way (or not configured locally).
 */
async function confirmPayment(sessionId: string | undefined, userId: string): Promise<FulfillResult> {
  if (!sessionId || !sessionId.startsWith("cs_")) return "unknown";
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // Someone else's session id must not activate or reveal anything.
    if (session.metadata?.userId !== userId) return "unknown";
    return await fulfillCheckoutSession(session);
  } catch (error) {
    console.error("[checkout] could not confirm session", error);
    return "unknown";
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await requireUser();
  const { t } = await getI18n();
  const c = t.checkout;
  const { session_id: sessionId } = await searchParams;
  const status = await confirmPayment(sessionId, user.id);
  const paid = status === "fulfilled" || status === "already-fulfilled";

  if (paid) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        {/* Plays once and stops on the finished check, before the file's own fade-out. */}
        <LottieIcon src="/lottie/success.json" trigger="once" playTo={0.7} className="h-28 w-28" />
        <h1 className="font-display text-2xl font-bold text-ink">{c.successTitle}</h1>
        <p className="text-muted">{c.successText}</p>
        <Button asChild size="lg">
          <Link href="/account/enrollments">{c.toCourses}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/10 text-amber">
        <Clock aria-hidden className="h-8 w-8" />
      </span>
      <h1 className="font-display text-2xl font-bold text-ink">{c.pendingTitle}</h1>
      <p className="text-muted">
        {status === "not-paid" ? c.pendingText : c.unknownText}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/account/enrollments">{c.myCourses}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">{t.common.contactUs}</Link>
        </Button>
      </div>
    </div>
  );
}
