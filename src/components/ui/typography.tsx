import React from "react";
import { cn } from "@/lib/utils";

// Page title (h1) — used once per page
export function PageTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn("text-3xl font-bold tracking-tight font-heading", className)}>{children}</h1>;
}

// Hero title (larger, for homepage)
export function HeroTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cn("text-4xl font-bold tracking-tight sm:text-5xl font-heading", className)}>{children}</h1>;
}

// Section title (h2) — major section headings
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-2xl font-bold font-heading", className)}>{children}</h2>;
}

// Section header (label) — uppercase, with red accent underline
export function SectionHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className={cn("text-xs font-semibold uppercase tracking-wider text-text-muted", className)}>
        {children}
      </span>
      <div className="h-0.5 w-6 bg-primary-accent mt-1 rounded-full" />
    </div>
  );
}

// Card title (h3) — card/component headings
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold font-heading", className)}>{children}</h3>;
}

// Body text — primary readable text
export function BodyText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-base leading-relaxed", className)}>{children}</p>;
}

// Secondary text — smaller body, descriptions
export function SecondaryText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-text-muted", className)}>{children}</p>;
}

// Caption — metadata, labels, small info
export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-xs text-text-muted", className)}>{children}</span>;
}

// Data value — numbers, stats, metrics (with tabular-nums)
export function DataValue({ children, className, highlight = false }: { 
  children: React.ReactNode; 
  className?: string;
  highlight?: boolean;
}) {
  return (
    <span className={cn(
      "tabular-nums",
      highlight ? "text-lg font-bold" : "text-sm font-semibold",
      className
    )}>
      {children}
    </span>
  );
}

// Data label — label for a data value
export function DataLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-xs text-text-muted uppercase tracking-wider", className)}>{children}</span>;
}

// Badge text — for badge/label content
export function BadgeText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-xs font-medium", className)}>{children}</span>;
}
