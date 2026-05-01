"use client";

import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  withBorder?: boolean;
  withBackground?: boolean;
  id?: string;
}

/**
 * Standard page section wrapper
 * 
 * Usage:
 * <PageSection>
 *   <h2 className="text-3xl font-bold text-text-heading">Title</h2>
 *   <p className="text-text-body">Content...</p>
 * </PageSection>
 */
export default function PageSection({
  children,
  className,
  containerClassName,
  withBorder = true,
  withBackground = true,
  id,
}: PageSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        withBorder && "border-t border-border",
        withBackground && "bg-background",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
