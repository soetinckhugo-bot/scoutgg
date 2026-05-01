import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";

interface ScoutIconProps extends Omit<LucideProps, "size"> {
  icon: React.ElementType<LucideProps>;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "accent" | "gold" | "success" | "danger" | "warning" | "muted" | "info" | "purple";
  glow?: boolean;
  bg?: boolean;
}

const sizeMap = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
};

const variantColorMap = {
  default: "text-text-body",
  accent: "text-primary-accent",
  gold: "text-yellow-400",
  success: "text-emerald-400",
  danger: "text-red-400",
  warning: "text-amber-400",
  muted: "text-text-muted",
  info: "text-blue-400",
  purple: "text-purple-400",
};

const glowMap = {
  default: "drop-shadow-[0_0_4px_rgba(160,174,192,0.4)]",
  accent: "drop-shadow-[0_0_6px_rgba(233,69,96,0.5)]",
  gold: "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]",
  success: "drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]",
  danger: "drop-shadow-[0_0_6px_rgba(248,113,113,0.5)]",
  warning: "drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]",
  muted: "drop-shadow-[0_0_4px_rgba(108,117,125,0.4)]",
  info: "drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]",
  purple: "drop-shadow-[0_0_6px_rgba(192,132,252,0.5)]",
};

const bgMap = {
  default: "bg-text-body/15",
  accent: "bg-primary-accent/20",
  gold: "bg-yellow-400/15",
  success: "bg-emerald-400/15",
  danger: "bg-red-400/15",
  warning: "bg-amber-400/15",
  muted: "bg-text-muted/15",
  info: "bg-blue-400/15",
  purple: "bg-purple-400/15",
};

export default function ScoutIcon({
  icon: Icon,
  size = "md",
  variant = "default",
  glow = false,
  bg = false,
  className,
  ...props
}: ScoutIconProps) {
  const sizeClass = sizeMap[size];
  const colorClass = variantColorMap[variant];
  const glowClass = glow ? glowMap[variant] : "";
  const bgClass = bg ? bgMap[variant] : "";

  if (bg) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          bgClass,
          size === "xs" && "p-1",
          size === "sm" && "p-1",
          size === "md" && "p-1.5",
          size === "lg" && "p-2",
          size === "xl" && "p-2.5"
        )}
      >
        <Icon
          className={cn(sizeClass, colorClass, glowClass, className)}
          {...props}
        />
      </div>
    );
  }

  return (
    <Icon
      className={cn(sizeClass, colorClass, glowClass, className)}
      {...props}
    />
  );
}
