"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Folder,
  Plus,
  Trash2,
  Users,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import PlayerCard from "@/components/PlayerCard";

interface PlayerListItem {
  id: string;
  playerId: string;
  player: {
    id: string;
    pseudo: string;
    realName: string | null;
    role: string;
    league: string;
    status: string;
    currentTeam: string | null;
    photoUrl: string | null;
    soloqStats: {
      currentRank: string;
      peakLp: number;
      winrate: number;
      totalGames: number;
    } | null;
    proStats: {
      kda: number | null;
      csdAt15: number | null;
      gdAt15: number | null;
      dpm: number | null;
      kpPercent: number | null;
      visionScore: number | null;
      championPool: string | null;
      gamesPlayed: number | null;
      season: string;
    } | null;
  };
}

interface PlayerList {
  id: string;
  name: string;
  description: string | null;
  color: string;
  players: PlayerListItem[];
  createdAt: string;
  updatedAt: string;
}

const PRESET_COLORS = [
  "#E94560",
  "#0F3460",
  "#28A745",
  "#FFC107",
  "#17A2B8",
  "#6F42C1",
  "#FD7E14",
  "#DC3545",
];

function hexToTwClass(hex: string): string | undefined {
  const map: Record<string, string> = {
    "#E94560": "bg-primary-accent",
    "#0F3460": "bg-accent",
    "#28A745": "bg-success",
    "#FFC107": "bg-warning",
    "#17A2B8": "bg-info",
    "#6F42C1": "bg-purple",
    "#FD7E14": "bg-orange",
    "#DC3545": "bg-destructive",
  };
  return map[hex.toUpperCase()];
}

export default function ListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<PlayerList[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListColor, setNewListColor] = useState("#E94560");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedList, setExpandedList] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchLists();
    }
  }, [status, router]);

  async function fetchLists() {
    try {
      const res = await fetch("/api/lists");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLists(data);
    } catch (err) {
      toast.error("Failed to load lists");
    } finally {
      setLoading(false);
    }
  }

  async function createList() {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          description: newListDesc,
          color: newListColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const list = await res.json();
      setLists((prev) => [list, ...prev]);
      setNewListName("");
      setNewListDesc("");
      setDialogOpen(false);
      toast.success(`Created list "${list.name}"`);
    } catch {
      toast.error("Failed to create list");
    } finally {
      setCreating(false);
    }
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this list?")) return;
    try {
      const res = await fetch("/api/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setLists((prev) => prev.filter((l) => l.id !== id));
      toast.success("List deleted");
    } catch {
      toast.error("Failed to delete list");
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary-accent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-heading mb-1">
              My Lists
            </h1>
            <p className="text-text-body">
              Organize players into custom collections
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button className="bg-surface-elevated text-text-heading hover:bg-secondary">
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-text-heading">Create New List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium mb-1 block text-text-heading">Name</label>
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. LFL ADCs 2026"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-text-heading">Description (optional)</label>
                  <Textarea
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                    placeholder="What is this list for?"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-text-heading">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => {
                      const twClass = hexToTwClass(c);
                      return (
                        <button
                          key={c}
                          onClick={() => setNewListColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newListColor === c
                              ? "border-white scale-110"
                              : "border-transparent"
                          } ${twClass || ""}`}
                          style={twClass ? undefined : { backgroundColor: c }}
                        />
                      );
                    })}
                  </div>
                </div>
                <Button
                  onClick={createList}
                  disabled={creating || !newListName.trim()}
                  className="w-full bg-surface-elevated text-text-heading hover:bg-secondary"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="h-16 w-16 text-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-heading mb-2">
              No lists yet
            </h2>
            <p className="text-text-body mb-6">
              Create custom lists to organize players by role, league, or scouting priority.
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-surface-elevated text-text-heading hover:bg-secondary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => (
              <Card
                key={list.id}
                className="border-border overflow-hidden bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-10 rounded-full ${hexToTwClass(list.color) || ""}`}
                        style={hexToTwClass(list.color) ? undefined : { backgroundColor: list.color }}
                      />
                      <div>
                        <CardTitle className="text-lg text-text-heading">{list.name}</CardTitle>
                        {list.description && (
                          <p className="text-sm text-text-body">
                            {list.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-surface-hover"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {list.players.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteList(list.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedList(expandedList === list.id ? null : list.id)
                        }
                        className="h-8 w-8 p-0"
                      >
                        {expandedList === list.id ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedList === list.id && (
                  <CardContent>
                    {list.players.length === 0 ? (
                      <div className="text-center py-6 text-sm text-text-body">
                        <p>This list is empty.</p>
                        <Link href="/players">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary-accent"
                          >
                            Browse players to add
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {list.players.map((item) => (
                          <PlayerCard
                            key={item.id}
                            player={item.player}
                            showStats
                            showFavorite={false}
                            variant="compact"
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
