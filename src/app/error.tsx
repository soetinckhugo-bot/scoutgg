"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-[#1A1A2E] dark:text-white mb-4">
        Oops
      </h1>
      <p className="text-xl text-[#6C757D] dark:text-gray-400 mb-8">
        Something went wrong. Please try again.
      </p>
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => reset()}
          className="border-[#1A1A2E] dark:border-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Link href="/">
          <Button className="bg-[#1A1A2E] text-white hover:bg-[#16213E]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

