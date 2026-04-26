"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f172a]">
        <div className="text-center max-w-md px-4">
          <h1 className="text-4xl font-bold text-[#1A1A2E] dark:text-white mb-4">
            Oops
          </h1>
          <p className="text-[#6C757D] dark:text-gray-400 mb-6">
            A critical error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-[#E94560] text-white rounded-md hover:bg-[#d63d56] transition-colors"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}

