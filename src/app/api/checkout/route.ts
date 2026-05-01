import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getPriceIds(): Record<string, string> {
  return {
    Supporter: process.env.STRIPE_PRICE_ID_SUPPORTER || "",
    "Scout Pro": process.env.STRIPE_PRICE_ID_SCOUTPRO || "",
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to subscribe." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const tier = body.tier as string;

    const PRICE_IDS = getPriceIds();
    if (!tier || !PRICE_IDS[tier]) {
      return NextResponse.json(
        { error: "Invalid tier selected" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured for this tier" },
        { status: 500 }
      );
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/pricing?success=true&tier=${encodeURIComponent(tier)}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        tier,
        userEmail: session.user.email,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    logger.error("Stripe checkout error", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

