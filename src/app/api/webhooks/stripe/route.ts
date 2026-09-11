import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const enrollmentId = session.metadata?.enrollmentId;
    const promoCodeId = session.metadata?.promoCodeId;

    if (enrollmentId) {
      const enrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "ACTIVE" },
      });

      const payment = await prisma.payment.update({
        where: { enrollmentId },
        data: {
          status: "SUCCEEDED",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
        },
      });

      if (promoCodeId) {
        await prisma.$transaction([
          prisma.promoRedemption.create({
            data: { promoCodeId, userId: enrollment.userId, paymentId: payment.id },
          }),
          prisma.promoCode.update({
            where: { id: promoCodeId },
            data: { usedCount: { increment: 1 } },
          }),
        ]);
      }

      await logAction(enrollment.userId, "payment.succeeded", "enrollment", enrollment.id, {
        stripeCheckoutId: session.id,
        ...(promoCodeId ? { promoCodeId } : {}),
      });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const enrollmentId = session.metadata?.enrollmentId;
    if (enrollmentId) {
      await prisma.payment
        .update({ where: { enrollmentId }, data: { status: "FAILED" } })
        .catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
