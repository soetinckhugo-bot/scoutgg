"use client";

import Image from "next/image";

interface FlagProps {
  code: string | string[];
  className?: string;
}

// Mapping des codes internes vers les codes ISO à 2 lettres (flagcdn.com)
const CODE_MAP: Record<string, string> = {
  // Europe
  eu: "eu",
  fr: "fr",
  es: "es",
  tr: "tr",
  de: "de",
  sa: "sa",
  ba: "ba",
  be: "be",
  nl: "nl",
  lu: "lu",
  cz: "cz",
  sk: "sk",
  gr: "gr",
  cy: "cy",
  it: "it",
  pl: "pl",
  lt: "lt",
  lv: "lv",
  ee: "ee",
  pt: "pt",
  uk: "gb",
  dk: "dk",
  no: "no",
  se: "se",
  fi: "fi",
  at: "at",
  ch: "ch",
  ca: "ca",
  hr: "hr",
  ma: "ma",
  ro: "ro",
  ru: "ru",
  rs: "rs",
  si: "si",
  ua: "ua",
  // World
  kr: "kr",
  cn: "cn",
  us: "us",
  br: "br",
  tw: "tw",
  // Noms complets (provenant des imports CSV)
  china: "cn",
  canada: "ca",
  croatia: "hr",
  "czech republic": "cz",
  denmark: "dk",
  france: "fr",
  germany: "de",
  greece: "gr",
  italy: "it",
  lithuania: "lt",
  morocco: "ma",
  poland: "pl",
  romania: "ro",
  russia: "ru",
  serbia: "rs",
  slovenia: "si",
  "south korea": "kr",
  spain: "es",
  sweden: "se",
  turkey: "tr",
  ukraine: "ua",
  "united states": "us",
};

function SingleFlag({ code, className = "" }: { code: string; className?: string }) {
  const countryCode = CODE_MAP[code.toLowerCase()];

  if (!countryCode) {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-3.5 rounded text-[8px] font-bold bg-border text-text-muted ${className}`}
      >
        {code.toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      alt={countryCode.toUpperCase()}
      width={20}
      height={14}
      className={`rounded-sm inline-block object-contain ${className}`}
      unoptimized
    />
  );
}

export default function Flag({ code, className = "" }: FlagProps) {
  if (Array.isArray(code)) {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`}>
        {code.map((c, i) => (
          <SingleFlag key={i} code={c} />
        ))}
      </span>
    );
  }

  return <SingleFlag code={code} className={className} />;
}
