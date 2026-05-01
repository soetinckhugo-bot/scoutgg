import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/server/db";
import { logger } from "@/lib/logger";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    logger.error("Stripe webhook signature verification failed", { message: err.message });
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  logger.info(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;

        if (!customerEmail) {
          logger.warn("No customer email in checkout session");
          break;
        }

        // Update or create user with premium status
        await db.user.upsert({
          where: { email: customerEmail },
          update: {
            isPremium: true,
            subscriptionStatus: "active",
            stripeCustomerId:
              (session.customer as string) || undefined,
            stripeSubscriptionId:
              (session.subscription as string) || undefined,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
          },
          create: {
            email: customerEmail,
            name: session.customer_details?.name || customerEmail,
            isPremium: true,
            subscriptionStatus: "active",
            stripeCustomerId: (session.customer as string) || undefined,
            stripeSubscriptionId:
              (session.subscription as string) || undefined,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        logger.info(`User ${customerEmail} upgraded to premium`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const periodEnd = invoice.lines?.data[0]?.period?.end;

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: "active",
            isPremium: true,
            premiumUntil: periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        logger.info(`Payment succeeded, premium extended for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "past_due" },
        });

        logger.info(`Subscription past_due for customer ${customerId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const isActive = status === "active" || status === "trialing";
        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            isPremium: isActive,
            subscriptionStatus: status,
            premiumUntil: (subscription as any).current_period_end
              ? new Date((subscription as any).current_period_end * 1000)
              : undefined,
          },
        });

        logger.info(`Subscription updated: ${status} for customer ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            isPremium: false,
            subscriptionStatus: "canceled",
            premiumUntil: new Date(),
          },
        });

        logger.info(`Subscription canceled for customer ${customerId}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            isPremium: false,
            subscriptionStatus: "refunded",
            premiumUntil: new Date(),
          },
        });

        logger.info(`Charge refunded for customer ${customerId}`);
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    logger.error("Webhook processing error:", { err });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

