"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, Check } from "lucide-react";

interface CopyLinkButtonProps {
  url: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export default function CopyLinkButton({ url, variant = "outline", size = "sm", className }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1.5 text-success" />
      ) : (
        <Link className="h-4 w-4 mr-1.5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
