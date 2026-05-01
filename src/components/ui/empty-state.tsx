import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, actionButton, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-text-heading mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-4 max-w-sm mx-auto">{description}</p>}
      {action && (
        <Link href={action.href}>
          <Button variant="outline" size="sm">{action.label}</Button>
        </Link>
      )}
      {actionButton && (
        <Button variant="outline" size="sm" onClick={actionButton.onClick}>
          {actionButton.label}
        </Button>
      )}
    </div>
  );
}
