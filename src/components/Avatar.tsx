"use client";

import Image from "next/image";

interface AvatarProps {
  src: string | null;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: { px: 32, className: "w-8 h-8 text-xs" },
  md: { px: 40, className: "w-10 h-10 text-sm" },
  lg: { px: 48, className: "w-12 h-12 text-lg" },
  xl: { px: 56, className: "w-14 h-14 text-xl" },
};

export default function Avatar({ src, alt, fallback, size = "md", className = "" }: AvatarProps) {
  const config = SIZE_MAP[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={config.px}
        height={config.px}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${config.className} rounded-full bg-[#F8F9FA] dark:bg-[#1e293b] flex items-center justify-center font-bold text-[#1A1A2E] dark:text-white shrink-0 ${className}`}
      aria-label={`Avatar de ${alt}`}
    >
      {(fallback?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

