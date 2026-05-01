"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Unhandled error", { error: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-text-heading mb-4">
        Oops
      </h1>
      <p className="text-xl text-text-body mb-8">
        Something went wrong. Please try again.
      </p>
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => reset()}
          className="border-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Link href="/">
          <Button className="bg-surface-elevated text-text-heading hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

