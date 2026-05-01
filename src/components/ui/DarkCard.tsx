"use client";

import { cn } from "@/lib/utils";

interface DarkCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  flex?: boolean;
}

/**
 * Standard dark card component matching the homepage design system
 * 
 * Usage:
 * <DarkCard hover padding="md">
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </DarkCard>
 */
export default function DarkCard({
  children,
  className,
  hover = false,
  padding = "md",
  flex = false,
}: DarkCardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        paddingClasses[padding],
        hover && "hover:border-border-hover hover:bg-surface-hover transition-all duration-200 cursor-pointer",
        flex && "flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}
