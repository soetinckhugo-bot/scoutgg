"use client";

import Image from "next/image";

interface FlagProps {
  code: string | string[];
  className?: string;
}

// Mapping des codes internes vers les codes ISO à 2 lettres (flagcdn.com)
const CODE_MAP: Record<string, string> = {
  // --- Codes ISO (Europe) ---
  al: "al", // Albania
  at: "at", // Austria
  ba: "ba", // Bosnia and Herzegovina
  be: "be", // Belgium
  bg: "bg", // Bulgaria
  ch: "ch", // Switzerland
  cy: "cy", // Cyprus
  cz: "cz", // Czech Republic
  de: "de", // Germany
  dk: "dk", // Denmark
  ee: "ee", // Estonia
  es: "es", // Spain
  eu: "eu", // Europe
  fi: "fi", // Finland
  fr: "fr", // France
  gb: "gb", // United Kingdom
  ge: "ge", // Georgia
  gr: "gr", // Greece
  hr: "hr", // Croatia
  hu: "hu", // Hungary
  ie: "ie", // Ireland
  is: "is", // Iceland
  it: "it", // Italy
  lt: "lt", // Lithuania
  lu: "lu", // Luxembourg
  lv: "lv", // Latvia
  md: "md", // Moldova
  me: "me", // Montenegro
  mk: "mk", // North Macedonia
  mt: "mt", // Malta
  nl: "nl", // Netherlands
  no: "no", // Norway
  pl: "pl", // Poland
  pt: "pt", // Portugal
  ro: "ro", // Romania
  rs: "rs", // Serbia
  ru: "ru", // Russia
  se: "se", // Sweden
  si: "si", // Slovenia
  sk: "sk", // Slovakia
  tr: "tr", // Turkey
  ua: "ua", // Ukraine
  uk: "gb", // United Kingdom (alias)

  // --- Codes ISO (Asie / Océanie) ---
  au: "au", // Australia
  cn: "cn", // China
  hk: "hk", // Hong Kong
  id: "id", // Indonesia
  il: "il", // Israel
  in: "in", // India
  jp: "jp", // Japan
  jo: "jo", // Jordan
  kr: "kr", // South Korea
  kz: "kz", // Kazakhstan
  lb: "lb", // Lebanon
  mn: "mn", // Mongolia
  my: "my", // Malaysia
  ph: "ph", // Philippines
  ps: "ps", // Palestine
  sa: "sa", // Saudi Arabia
  sg: "sg", // Singapore
  sy: "sy", // Syria
  th: "th", // Thailand
  tw: "tw", // Taiwan
  vn: "vn", // Vietnam

  // --- Codes ISO (Amériques) ---
  ar: "ar", // Argentina
  br: "br", // Brazil
  ca: "ca", // Canada
  cl: "cl", // Chile
  co: "co", // Colombia
  mx: "mx", // Mexico
  pe: "pe", // Peru
  us: "us", // United States
  uy: "uy", // Uruguay
  ve: "ve", // Venezuela

  // --- Codes ISO (Afrique / Moyen-Orient) ---
  dz: "dz", // Algeria
  eg: "eg", // Egypt
  iq: "iq", // Iraq
  ma: "ma", // Morocco
  tn: "tn", // Tunisia
  za: "za", // South Africa

  // --- Noms complets (provenant des imports CSV et saisie manuelle) ---
  albania: "al",
  algeria: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",
  belgium: "be",
  "bosnia and herzegovina": "ba",
  brasil: "br",
  brazil: "br",
  bulgaria: "bg",
  canada: "ca",
  chile: "cl",
  china: "cn",
  colombia: "co",
  croatia: "hr",
  "czech republic": "cz",
  denmark: "dk",
  egypt: "eg",
  estonia: "ee",
  finland: "fi",
  france: "fr",
  georgia: "ge",
  germany: "de",
  greece: "gr",
  "hong kong": "hk",
  hungary: "hu",
  india: "in",
  indonesia: "id",
  iraq: "iq",
  ireland: "ie",
  israel: "il",
  italy: "it",
  japan: "jp",
  jordan: "jo",
  kazakhstan: "kz",
  korea: "kr",
  latvia: "lv",
  lebanon: "lb",
  lithuania: "lt",
  moldova: "md",
  mongolia: "mn",
  montenegro: "me",
  morocco: "ma",
  netherlands: "nl",
  "north macedonia": "mk",
  norway: "no",
  palestine: "ps",
  peru: "pe",
  philippines: "ph",
  poland: "pl",
  portugal: "pt",
  "republic of ireland": "ie",
  romania: "ro",
  romanian: "ro",
  russia: "ru",
  "saudi arabia": "sa",
  serbia: "rs",
  singapore: "sg",
  slovakia: "sk",
  slovenia: "si",
  "south africa": "za",
  "south korea": "kr",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  syria: "sy",
  taiwan: "tw",
  thailand: "th",
  tunisia: "tn",
  turkey: "tr",
  ukraine: "ua",
  "united kingdom": "gb",
  "united states": "us",
  uruguay: "uy",
  venezuela: "ve",
  vietnam: "vn",
};

function SingleFlag({ code, className = "" }: { code: string; className?: string }) {
  const trimmed = code.trim();
  if (!trimmed) return null;

  // Handle HTML comments and extra text (e.g. "France<!-- comment -->")
  const cleanCode = trimmed.split("<")[0].trim();
  const countryCode = CODE_MAP[cleanCode.toLowerCase()];

  if (!countryCode) {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-3.5 rounded text-[8px] font-bold bg-border text-text-muted ${className}`}
      >
        {cleanCode.slice(0, 3).toUpperCase()}
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
          <SingleFlag key={`flag-${c}-${i}`} code={c} />
        ))}
      </span>
    );
  }

  return <SingleFlag code={code} className={className} />;
}
