"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Menu, User, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";

const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false });

interface Suggestion {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  currentTeam: string | null;
  photoUrl: string | null;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/players", label: "Players" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/prospects", label: "Prospects" },
  { href: "/compare", label: "Comparison" },
  { href: "/similarity", label: "Similarity" },
  { href: "/tierlists", label: "Tiers" },
  { href: "/pricing", label: "Pricing" },
];

function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(trimmed)}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return { suggestions, loading };
}

function SearchDropdown({
  suggestions,
  loading,
  query,
  onSelect,
  onClose,
  inputRef,
}: {
  suggestions: Suggestion[];
  loading: boolean;
  query: string;
  onSelect: () => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (query.trim().length < 2) return;
      const maxIndex = suggestions.length - 1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = prev >= maxIndex ? 0 : prev + 1;
          itemRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeIndex <= 0) {
          setActiveIndex(-1);
          inputRef.current?.focus();
        } else {
          setActiveIndex((prev) => {
            const next = prev - 1;
            itemRefs.current[next]?.focus();
            return next;
          });
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, activeIndex, onClose, inputRef, query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, suggestions]);

  if (query.trim().length < 2) return null;

  const showNoResults = !loading && suggestions.length === 0;

  return (
    <div
      ref={dropdownRef}
      id="search-suggestions-listbox"
      role="listbox"
      aria-label="Search suggestions"
      className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg border border-border shadow-xl overflow-hidden z-50"
    >
      {loading && (
        <div className="px-4 py-3 text-sm text-text-muted">Loading...</div>
      )}

      {showNoResults && (
        <div className="px-4 py-3 text-sm text-text-muted">No results</div>
      )}

      {!loading &&
        suggestions.map((s, index) => (
          <Link
            key={s.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            href={`/players/${s.id}`}
            onClick={onSelect}
            role="option"
            aria-selected={activeIndex === index}
            id={`search-suggestion-${s.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <Avatar size="sm">
              {s.photoUrl ? (
                <AvatarImage src={s.photoUrl} alt={s.pseudo} />
              ) : null}
              <AvatarFallback className="bg-card text-text-muted text-xs">
                <User className="size-3" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-heading truncate">
                  {s.pseudo}
                </span>
                <span className="text-xs h-4 px-2 bg-card text-text-muted border border-border rounded-md flex items-center">
                  {s.role}
                </span>
              </div>
              {s.realName && (
                <p className="text-xs text-text-muted truncate">{s.realName}</p>
              )}
            </div>
          </Link>
        ))}
    </div>
  );
}

function SearchInputWithAutocomplete({
  className,
  inputClassName,
}: {
  className?: string;
  inputClassName?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { suggestions, loading } = useSearchSuggestions(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
        }
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
      if (e.key === "Enter") {
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          setOpen(false);
          setActiveIndex(-1);
          window.location.href = `/players/${suggestions[activeIndex].id}`;
        } else if (searchQuery.trim()) {
          setOpen(false);
          window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        }
      }
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    },
    [searchQuery, open, suggestions, activeIndex]
  );

  return (
    <div className={cn("relative isolate", className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted z-10 pointer-events-none" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search players..."
        aria-label="Search players"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={open ? "search-suggestions-listbox" : undefined}
        aria-activedescendant={
          open && suggestions.length > 0 && suggestions[0]?.id
            ? `search-suggestion-${suggestions[0].id}`
            : undefined
        }
        className={cn(
          "w-full h-10 pl-10 pr-4 py-2 bg-card border-border focus:border-ring focus:ring-primary-accent text-text-heading text-base leading-normal",
          inputClassName
        )}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (searchQuery.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <SearchDropdown
          suggestions={suggestions}
          loading={loading}
          query={searchQuery}
          onSelect={() => {
            setOpen(false);
            setSearchQuery("");
          }}
          onClose={() => setOpen(false)}
          inputRef={inputRef}
        />
      )}
    </div>
  );
}

function UserDropdown() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (status === "loading") {
    return <div className="h-8 w-8 bg-border rounded-full animate-pulse" />;
  }

  if (session?.user) {
    const initials = session.user.name
      ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : session.user.email?.[0].toUpperCase() || "U";

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="User menu"
          className="flex items-center gap-2 rounded-full hover:bg-surface transition-colors px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
        >
          <Avatar className="h-8 w-8">
            {session.user.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name || ""} />
            ) : null}
            <AvatarFallback className="bg-card text-text-muted text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3 text-text-muted" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg border border-border shadow-xl overflow-hidden z-50 py-1">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-text-heading truncate">
                {session.user.name || session.user.email}
              </p>
              <p className="text-xs text-text-muted truncate">
                {session.user.email}
              </p>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-text-muted hover:bg-surface-hover hover:text-text-heading transition-colors"
            >
              Settings
            </Link>
            <div className="border-t border-border mt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-4 py-2 text-sm text-text-heading hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-text-muted hover:text-text-heading transition-colors">
        Sign In
      </Link>
      <Link href="/register" className="px-3 py-1.5 text-sm font-medium text-text-heading bg-primary-accent rounded-md hover:bg-primary-accent/90 transition-colors">
        Sign Up
      </Link>
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <CommandPalette />
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8 overflow-visible">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 mr-4">
            <span className="font-heading text-xl font-bold tracking-tight text-text-heading">
              League<span className="text-primary-accent">Scout</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block w-[200px] lg:w-[240px] xl:w-[280px] relative overflow-visible shrink-0">
            <SearchInputWithAutocomplete className="w-full relative overflow-visible" />
          </div>

          {/* Right: Nav */}
          <nav className="hidden md:flex items-center gap-0 shrink-0 ml-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="px-3 py-2 text-sm font-medium text-text-heading hover:text-text-heading transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary-accent/50 focus-visible:ring-offset-2 focus-visible:outline-none rounded-md"
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-2">
              <NotificationBell />
              <UserDropdown />
            </div>
          </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-accent disabled:pointer-events-none disabled:opacity-50 hover:bg-surface-hover hover:text-text-heading h-10 w-10 min-h-[44px] min-w-[44px]"
          >
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-6 mt-8">
              <SearchInputWithAutocomplete inputClassName="border-border" />
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="px-3 py-3 text-sm font-medium text-text-muted hover:text-text-heading hover:bg-surface rounded-md transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <UserDropdown />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      </header>
    </>
  );
}

