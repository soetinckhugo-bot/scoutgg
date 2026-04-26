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
        <h2 className="text-2xl font-bold text-[#1A1A2E] dark:text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-[#6C757D] dark:text-gray-400 mb-6">
          We&apos;ve been notified and are working on a fix.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-[#1A1A2E] text-white rounded-md hover:bg-[#16213E] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

