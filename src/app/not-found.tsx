import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-[#1A1A2E] dark:text-white mb-4">
        404
      </h1>
      <p className="text-xl text-[#6C757D] dark:text-gray-400 mb-8">
        This page could not be found.
      </p>
      <Link href="/">
        <Button className="bg-[#1A1A2E] text-white hover:bg-[#16213E]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

