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
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-4xl font-bold text-text-heading mb-4">
            Oops
          </h1>
          <p className="text-text-body mb-6">
            A critical error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-primary-accent text-text-heading rounded-md hover:bg-primary-accent/90 transition-colors"
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  );
}

