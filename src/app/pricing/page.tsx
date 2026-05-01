"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Star, Zap, MessageCircle, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { logger } from "@/lib/logger";

const tiers: Array<{
  name: string;
  icon: typeof Star;
  price: string;
  period: string;
  description: string;
  features: Array<{ name: string; included: boolean }>;
  cta: string;
  ctaHref: string;
  ctaVariant: "outline" | "default";
  highlight: boolean;
  checkoutTier: string | null;
  badge?: string | null;
}> = [
  {
    name: "Free",
    icon: Star,
    price: "€0",
    period: "Forever free",
    description: "Browse and discover talent",
    features: [
      { name: "Player profiles (basic)", included: true },
      { name: "Search & filters", included: true },
      { name: "Free scouting reports", included: true },
      { name: "SoloQ stats", included: true },
      { name: "Pro stats", included: true },
      { name: "VOD links", included: true },
      { name: "Premium reports", included: false },
      { name: "Watchlist / Favorites", included: false },
      { name: "Advanced filters", included: false },
      { name: "Export data", included: false },
      { name: "Discord access", included: false },
      { name: "API access", included: false },
    ],
    cta: "Get Started",
    ctaHref: "/players",
    ctaVariant: "outline" as const,
    highlight: false,
    checkoutTier: null as string | null,
  },
  {
    name: "Supporter",
    icon: Zap,
    price: "€1.99",
    period: "per month",
    description: "Support the platform + extras",
    features: [
      { name: "Player profiles (basic)", included: true },
      { name: "Search & filters", included: true },
      { name: "Free scouting reports", included: true },
      { name: "SoloQ stats", included: true },
      { name: "Pro stats", included: true },
      { name: "VOD links", included: true },
      { name: "Premium reports", included: true },
      { name: "Watchlist / Favorites", included: true },
      { name: "Advanced filters", included: false },
      { name: "Export data", included: false },
      { name: "Discord access", included: false },
      { name: "API access", included: false },
    ],
    cta: "Subscribe",
    ctaHref: "#",
    ctaVariant: "default" as const,
    highlight: false,
    checkoutTier: "Supporter",
  },
  {
    name: "Scout Pro",
    icon: Star,
    price: "€9.99",
    period: "per month",
    description: "Full access for professionals",
    features: [
      { name: "Player profiles (basic)", included: true },
      { name: "Search & filters", included: true },
      { name: "Free scouting reports", included: true },
      { name: "SoloQ stats", included: true },
      { name: "Pro stats", included: true },
      { name: "VOD links", included: true },
      { name: "Premium reports", included: true },
      { name: "Watchlist / Favorites", included: true },
      { name: "Advanced filters", included: true },
      { name: "Export data (CSV)", included: true },
      { name: "Discord access", included: true },
      { name: "API access", included: false },
    ],
    cta: "Subscribe",
    ctaHref: "#",
    ctaVariant: "default" as const,
    highlight: true,
    checkoutTier: "Scout Pro",
    badge: "Most Popular",
  },
  {
    name: "Consulting",
    icon: MessageCircle,
    price: "Custom",
    period: "Contact us",
    description: "For teams & organizations",
    features: [
      { name: "Everything in Scout Pro", included: true },
      { name: "Custom reports", included: true },
      { name: "Player deep dives", included: true },
      { name: "Team scouting", included: true },
      { name: "API access", included: true },
      { name: "Dedicated support", included: true },
      { name: "White-label options", included: true },
      { name: "Monthly strategy calls", included: true },
    ],
    cta: "Contact Us",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlight: false,
    checkoutTier: null as string | null,
    badge: null,
  },
];

function SuccessBanner({ tier }: { tier: string }) {
  return (
    <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-400">
            Welcome to {tier}!
          </h3>
          <p className="text-sm text-emerald-400/80">
            Your subscription is active. You now have access to all {tier} features.
          </p>
        </div>
      </div>
    </div>
  );
}

function CanceledBanner() {
  return (
    <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <X className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-400">
            Subscription canceled
          </h3>
          <p className="text-sm text-amber-400/80">
            No worries — you can subscribe anytime. Your free access remains active.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tierName: string) => {
    if (status === "loading") return;

    if (!session?.user) {
      toast.error("Please sign in to subscribe");
      return;
    }

    setLoadingTier(tierName);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      logger.error("Checkout error", { error });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Success / Cancel banners */}
      <Suspense fallback={null}>
        <QueryParamsBanners />
      </Suspense>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-text-heading mb-4">
          Choose Your Plan
        </h1>
        <p className="text-text-body max-w-xl mx-auto">
          From casual fan to professional scout. Find the plan that fits your needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${
              tier.highlight
                ? "border-2 border-primary-accent shadow-lg shadow-primary-accent/10"
                : "border border-border"
            } ${tier.badge ? "overflow-visible" : ""}`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-primary-accent px-3 py-1 text-xs font-semibold text-text-heading whitespace-nowrap">
                  {tier.badge}
                </span>
              </div>
            )}

            <CardHeader className={`pb-4 ${tier.badge ? "pt-6" : "pt-2"}`}>
              <div className="min-h-[28px]">
                {tier.badge ? null : <div className="h-[28px]" />}
              </div>
              <CardTitle className="text-xl flex items-center gap-2">
                <tier.icon
                  className={`h-5 w-5 ${
                    tier.highlight ? "text-primary-accent" : "text-text-muted"
                  }`}
                />
                {tier.name}
              </CardTitle>
              <div className="min-h-[80px]">
                <p className="text-3xl font-bold text-text-heading">
                  {tier.price}
                </p>
                <p className="text-sm text-text-body">
                  {tier.period}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {tier.description}
                </p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-2.5 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature.name}
                    className={`flex items-center gap-2 text-sm ${
                      feature.included
                        ? "text-text-heading"
                        : "text-text-muted"
                    }`}
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    {feature.name}
                  </li>
                ))}
              </ul>

              {tier.ctaVariant === "outline" ? (
                <Link
                  href={tier.ctaHref}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border text-text-heading hover:bg-surface-hover hover:border-border-hover h-10 px-4 py-2 w-full mt-6 transition-colors min-h-[44px]"
                >
                  {tier.cta}
                </Link>
              ) : (
                <Button
                  className={`w-full mt-6 min-h-[44px] h-10 ${
                    tier.highlight
                      ? "bg-primary-accent hover:bg-primary-accent/90 text-text-heading"
                      : "bg-surface-elevated hover:bg-secondary text-text-heading"
                  }`}
                  onClick={() => {
                    if (tier.checkoutTier) {
                      handleSubscribe(tier.checkoutTier);
                    }
                  }}
                  disabled={loadingTier === tier.checkoutTier}
                >
                  {loadingTier === tier.checkoutTier ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {tier.cta}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ / Contact */}
      <div className="mt-16 text-center">
        <p className="text-text-body mb-4">
          Questions? Need a custom plan for your organization?
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-primary-accent hover:text-primary-accent/90 font-medium"
        >
          <Mail className="h-4 w-4" />
          Contact us
        </Link>
      </div>
    </div>
    </div>
  );
}

function QueryParamsBanners() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const successTier = searchParams.get("tier");

  useEffect(() => {
    if (success) {
      toast.success(`Subscribed to ${successTier || "Scout Pro"}!`);
    }
    if (canceled) {
      toast.info("Subscription canceled");
    }
  }, [success, canceled, successTier]);

  return (
    <>
      {success && successTier && <SuccessBanner tier={successTier} />}
      {canceled && <CanceledBanner />}
    </>
  );
}

