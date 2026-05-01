"use client";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

/**
 * Standard section header with title and optional subtitle
 * 
 * Usage:
 * <SectionHeader title="Our Championships" subtitle="10+ leagues covered worldwide" />
 */
export default function SectionHeader({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="text-3xl font-bold text-text-heading mb-3 font-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="text-text-body">{subtitle}</p>
      )}
    </div>
  );
}
