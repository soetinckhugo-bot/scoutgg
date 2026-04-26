"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Star, Zap, MessageCircle, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
    <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center shrink-0">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Welcome to {tier}!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-400">
            Your subscription is active. You now have access to all {tier} features.
          </p>
        </div>
      </div>
    </div>
  );
}

function CanceledBanner() {
  return (
    <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center shrink-0">
          <X className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-300">
            Subscription canceled
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400">
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
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Success / Cancel banners */}
      <Suspense fallback={null}>
        <QueryParamsBanners />
      </Suspense>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-[#6C757D] dark:text-gray-400 max-w-xl mx-auto">
          From casual fan to professional scout. Find the plan that fits your needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${
              tier.highlight
                ? "border-[#E94560] dark:border-[#E94560] shadow-lg"
                : "border-[#E9ECEF] dark:border-gray-700"
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center rounded-full bg-[#E94560] px-3 py-1 text-xs font-semibold text-white whitespace-nowrap shadow-sm">
                  {tier.badge}
                </span>
              </div>
            )}

            <CardHeader className="pb-4 pt-2">
              <div className="min-h-[28px]">
                {tier.badge ? null : <div className="h-[28px]" />}
              </div>
              <CardTitle className="text-xl flex items-center gap-2">
                <tier.icon
                  className={`h-5 w-5 ${
                    tier.highlight ? "text-[#E94560]" : "text-[#6C757D] dark:text-gray-400"
                  }`}
                />
                {tier.name}
              </CardTitle>
              <div className="min-h-[80px]">
                <p className="text-3xl font-bold text-[#1A1A2E] dark:text-white">
                  {tier.price}
                </p>
                <p className="text-sm text-[#6C757D] dark:text-gray-400">
                  {tier.period}
                </p>
                <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">
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
                        ? "text-[#1A1A2E] dark:text-white"
                        : "text-[#6C757D] dark:text-gray-500"
                    }`}
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 text-[#28A745] shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-[#DC3545] shrink-0" />
                    )}
                    {feature.name}
                  </li>
                ))}
              </ul>

              {tier.ctaVariant === "outline" ? (
                <Link
                  href={tier.ctaHref}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-[#1A1A2E] dark:border-white text-[#1A1A2E] dark:text-white hover:bg-[#1A1A2E] hover:text-white dark:hover:bg-white dark:hover:text-[#0f172a] h-9 px-4 py-2 w-full mt-6 transition-colors"
                >
                  {tier.cta}
                </Link>
              ) : (
                <Button
                  className={`w-full mt-6 ${
                    tier.highlight
                      ? "bg-[#E94560] hover:bg-[#d63d56] text-white"
                      : "bg-[#1A1A2E] hover:bg-[#16213E] text-white"
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
        <p className="text-[#6C757D] dark:text-gray-400 mb-4">
          Questions? Need a custom plan for your organization?
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-[#0F3460] hover:text-[#1A1A2E] dark:text-gray-400 dark:hover:text-white font-medium"
        >
          <Mail className="h-4 w-4" />
          Contact us
        </Link>
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

