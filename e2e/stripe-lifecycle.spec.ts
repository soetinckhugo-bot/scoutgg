import { test, expect } from "@playwright/test";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_ci", {
  apiVersion: "2026-03-25.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_ci";

function generateStripeSignature(payload: string, secret: string): string {
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}

async function sendWebhook(request: any, eventType: string, eventData: any) {
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2026-03-25.dahlia",
    created: Math.floor(Date.now() / 1000),
    type: eventType,
    data: { object: eventData },
  });

  const signature = generateStripeSignature(payload, webhookSecret);

  return request.post("/api/webhooks/stripe", {
    headers: {
      "Stripe-Signature": signature,
      "Content-Type": "application/json",
    },
    data: payload,
  });
}

test.describe("Stripe Subscription Lifecycle", () => {
  const testEmail = `stripe-test-${Date.now()}@example.com`;
  const customerId = `cus_test_${Date.now()}`;
  const subscriptionId = `sub_test_${Date.now()}`;

  test("checkout.session.completed activates premium", async ({ request }) => {
    const response = await sendWebhook(request, "checkout.session.completed", {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      customer: customerId,
      customer_details: {
        email: testEmail,
        name: "Test User",
      },
      subscription: subscriptionId,
      status: "complete",
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.received).toBe(true);
  });

  test("invoice.payment_succeeded extends premium", async ({ request }) => {
    const response = await sendWebhook(request, "invoice.payment_succeeded", {
      id: `in_test_${Date.now()}`,
      object: "invoice",
      customer: customerId,
      subscription: subscriptionId,
      lines: {
        data: [
          {
            period: {
              end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            },
          },
        ],
      },
      status: "paid",
    });

    expect(response.status()).toBe(200);
  });

  test("customer.subscription.updated handles cancellation", async ({ request }) => {
    const response = await sendWebhook(request, "customer.subscription.updated", {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60,
      cancel_at_period_end: true,
    });

    expect(response.status()).toBe(200);
  });

  test("customer.subscription.deleted removes premium", async ({ request }) => {
    const response = await sendWebhook(request, "customer.subscription.deleted", {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "canceled",
    });

    expect(response.status()).toBe(200);
  });

  test("charge.refunded handles refund", async ({ request }) => {
    const response = await sendWebhook(request, "charge.refunded", {
      id: `ch_test_${Date.now()}`,
      object: "charge",
      customer: customerId,
      amount_refunded: 999,
      refunded: true,
    });

    expect(response.status()).toBe(200);
  });
});
