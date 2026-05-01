"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "cmdk";
import {
  Home,
  Users,
  Crown,
  TrendingUp,
  Zap,
  Heart,
  Folder,
  FileText,
  Star,
  BarChart3,
  Settings,
  Search,
  User,
  Clock,
  Trash2,
} from "lucide-react";

interface Suggestion {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  currentTeam: string | null;
}

const PAGES = [
  { icon: Home, label: "Home", href: "/", shortcut: "H" },
  { icon: Users, label: "Players", href: "/players", shortcut: "P" },
  { icon: Crown, label: "Prospects", href: "/prospects", shortcut: "R" },
  { icon: TrendingUp, label: "Leaderboards", href: "/leaderboards", shortcut: "L" },
  { icon: Zap, label: "Compare", href: "/compare", shortcut: "C" },
  { icon: Heart, label: "Watchlist", href: "/watchlist", shortcut: "W" },
  { icon: Folder, label: "My Lists", href: "/lists", shortcut: "M" },
  { icon: FileText, label: "Reports", href: "/reports", shortcut: "E" },
  { icon: Star, label: "Tier Lists", href: "/tierlists", shortcut: "T" },
  { icon: BarChart3, label: "Dashboard", href: "/dashboard", shortcut: "D" },
  { icon: Settings, label: "Settings", href: "/settings", shortcut: "S" },
];

const RECENT_SEARCHES_KEY = "LeagueScout_recent_searches";
const MAX_RECENT = 10;

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={`mark-${part}-${i}`} className="bg-primary-accent/30 text-primary-accent rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={`span-${part}-${i}`}>{part}</span>
    )
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save recent search
  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== search.toLowerCase());
      const updated = [search, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Toggle with CMD+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch player suggestions when query changes
  useEffect(() => {
    if (!open || query.length < 2) {
      setPlayers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.suggestions || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, open]);

  const handleSelect = useCallback(
    (href: string, searchTerm?: string) => {
      setOpen(false);
      setQuery("");
      if (searchTerm) {
        addRecentSearch(searchTerm);
      }
      router.push(href);
    },
    [router, addRecentSearch]
  );

  const handlePlayerSelect = useCallback(
    (player: Suggestion) => {
      addRecentSearch(player.pseudo);
      setOpen(false);
      setQuery("");
      router.push(`/players/${player.id}`);
    },
    [router, addRecentSearch]
  );

  const handleRecentSelect = useCallback(
    (search: string) => {
      setQuery(search);
      // Trigger search immediately
      setLoading(true);
      fetch(`/api/search/suggestions?q=${encodeURIComponent(search)}`)
        .then((res) => res.json())
        .then((data) => {
          setPlayers(data.suggestions || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    []
  );

  const showRecent = query.length < 2 && recentSearches.length > 0;
  const resultCount = players.length;

  return (
    <CommandDialog open={open} onOpenChange={setOpen} aria-label="Command palette">
      <CommandInput
        placeholder="Type a command or search players..."
        value={query}
        onValueChange={setQuery}
        aria-label="Search commands or players"
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="py-4 text-center text-sm text-text-body">
              Searching...
            </div>
          ) : query.length >= 2 ? (
            <div className="py-4 text-center text-sm text-text-body">
              No results found.
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-text-body">
              Start typing to search players...
            </div>
          )}
        </CommandEmpty>

        {/* Recent Searches */}
        {showRecent && (
          <CommandGroup
            heading={
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentSearches();
                  }}
                  className="text-xs text-text-muted hover:text-primary-accent flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
            }
          >
            {recentSearches.slice(0, 5).map((search) => (
              <CommandItem
                key={search}
                onSelect={() => handleRecentSelect(search)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Clock className="h-4 w-4 text-text-body" />
                <span className="text-sm">{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {showRecent && players.length > 0 && <CommandSeparator />}

        {/* Player Results */}
        {players.length > 0 && (
          <CommandGroup
            heading={
              <span className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                Players
                <span className="text-xs text-text-muted ml-1">
                  ({resultCount})
                </span>
              </span>
            }
          >
            {players.map((player) => (
              <CommandItem
                key={player.id}
                onSelect={() => handlePlayerSelect(player)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4 text-text-body" />
                <span className="font-medium">
                  {highlightMatch(player.pseudo, query)}
                </span>
                {player.realName && (
                  <span className="text-xs text-text-body">
                    ({player.realName})
                  </span>
                )}
                <span className="text-xs text-text-body ml-auto">
                  {player.role}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {players.length > 0 && <CommandSeparator />}

        {/* Pages */}
        <CommandGroup heading="Navigation">
          {PAGES.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => handleSelect(page.href)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <page.icon className="h-4 w-4 text-text-body" />
              <span>{page.label}</span>
              <kbd className="ml-auto text-xs bg-card px-2 py-1 rounded text-text-body">
                ⌘{page.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="bg-card px-1 rounded">↑</kbd>
            <kbd className="bg-card px-1 rounded">↓</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-card px-1 rounded">↵</kbd>
            <span>select</span>
          </span>
        </div>
        <div>
          {query.length >= 2 ? (
            <span>
              {resultCount} result{resultCount !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <kbd className="bg-card px-1 rounded">⌘</kbd>
              <kbd className="bg-card px-1 rounded">K</kbd>
              <span>toggle</span>
            </span>
          )}
        </div>
      </div>
    </CommandDialog>
  );
}
