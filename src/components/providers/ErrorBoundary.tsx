"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h2 className="text-2xl font-bold text-text-heading mb-4">
          Something went wrong
        </h2>
        <p className="text-text-body mb-6">
          We&apos;ve been notified and are working on a fix.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-surface-elevated text-text-heading rounded-md hover:bg-secondary transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

