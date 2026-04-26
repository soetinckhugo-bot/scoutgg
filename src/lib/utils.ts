import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStatus(status: string): string {
  if (status === "SCOUTING") return "🔍 Scouting";
  return status.replace(/_/g, " ");
}

