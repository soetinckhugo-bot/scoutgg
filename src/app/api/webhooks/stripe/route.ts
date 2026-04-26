import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;

        if (!customerEmail) {
          console.warn("No customer email in checkout session");
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

        console.log(`User ${customerEmail} upgraded to premium`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "past_due" },
        });

        console.log(`Subscription past_due for customer ${customerId}`);
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

        console.log(`Subscription canceled for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

