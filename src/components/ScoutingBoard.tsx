"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";
import {
  ClipboardList,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Edit3,
  Star,
  MessageSquare,
  Loader2,
  Plus,
} from "lucide-react";

interface ColumnDef {
  key: string;
  label: string;
  color: string;
}

interface PlayerSummary {
  id: string;
  pseudo: string;
  role: string;
  league: string;
  status: string;
  currentTeam: string | null;
  photoUrl: string | null;
  tier: string | null;
  proStats: {
    globalScore: number | null;
    tierScore: number | null;
    winRate: number | null;
    gamesPlayed: number | null;
  } | null;
}

interface ScoutingCardData {
  id: string;
  userId: string;
  playerId: string;
  status: string;
  notes: string | null;
  priority: number | null;
  tags: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  player: PlayerSummary;
}

interface BoardData {
  columns: ColumnDef[];
  cards: ScoutingCardData[];
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-text-muted",
  2: "text-amber-500",
  3: "text-primary-accent",
};

function PriorityDots({ priority }: { priority: number | null }) {
  const p = priority ?? 0;
  if (p === 0) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`size-3 ${
            i <= p ? PRIORITY_COLORS[p] || "text-text-muted" : "text-border"
          }`}
          fill={i <= p ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function ScoutingCardItem({
  card,
  index,
  onDelete,
  onUpdate,
}: {
  card: ScoutingCardData;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<ScoutingCardData>) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [noteDraft, setNoteDraft] = useState(card.notes || "");
  const [menuOpen, setMenuOpen] = useState(false);

  const player = card.player;
  const score = player.proStats?.globalScore ?? player.proStats?.tierScore ?? null;

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative rounded-lg border bg-card p-3 transition-shadow ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-primary-accent/30 border-primary-accent/50"
              : "border-border hover:border-border-hover"
          }`}
        >
          <div className="flex items-start gap-2">
            {/* Drag handle */}
            <div
              {...provided.dragHandleProps}
              className="mt-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-body"
            >
              <GripVertical className="size-4" />
            </div>

            {/* Avatar */}
            <Avatar className="h-9 w-9 shrink-0">
              {player.photoUrl ? (
                <AvatarImage src={player.photoUrl} alt={player.pseudo} />
              ) : null}
              <AvatarFallback className="bg-muted text-text-heading text-xs">
                {(player.pseudo?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/players/${player.id}`}
                  className="font-semibold text-sm text-text-heading truncate hover:text-primary-accent transition-colors"
                >
                  {player.pseudo}
                </Link>
                <Badge
                  variant="secondary"
                  className={`text-[10px] h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}
                >
                  {player.role}
                </Badge>
              </div>
              <div className="text-xs text-text-body mt-0.5">
                {player.league}
                {player.currentTeam ? ` · ${player.currentTeam}` : ""}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <PriorityDots priority={card.priority} />
                {score !== null && (
                  <span className="text-xs font-medium text-primary-accent tabular-nums">
                    {score.toFixed(1)}
                  </span>
                )}
                {card.notes && (
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-text-muted hover:text-text-body transition-colors"
                  >
                    <MessageSquare className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-text-muted hover:text-text-body p-1 rounded"
              >
                <MoreHorizontal className="size-4" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card backdrop-blur-sm shadow-lg py-1">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-heading hover:bg-surface-hover"
                    >
                      <Edit3 className="size-3.5" />
                      Edit notes
                    </button>
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          onUpdate(card.id, { priority: p });
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-hover ${
                          card.priority === p
                            ? "text-primary-accent"
                            : "text-text-body"
                        }`}
                      >
                        <Star
                          className="size-3.5"
                          fill={card.priority === p ? "currentColor" : "none"}
                        />
                        Priority {p}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        onDelete(card.id);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes display */}
          {showNotes && card.notes && (
            <div className="mt-2 text-xs text-text-body bg-surface-hover rounded px-2 py-1.5">
              {card.notes}
            </div>
          )}

          {/* Edit notes inline */}
          {editMode && (
            <div className="mt-2 space-y-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-accent resize-none"
                rows={2}
                placeholder="Add notes..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    onUpdate(card.id, { notes: noteDraft });
                    setEditMode(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setNoteDraft(card.notes || "");
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function ScoutingColumnComponent({
  column,
  cards,
  onDelete,
  onUpdate,
}: {
  column: ColumnDef;
  cards: ScoutingCardData[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<ScoutingCardData>) => void;
}) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px] shrink-0">
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-lg border-t-2 border-x border-border bg-surface-hover"
        style={{ borderTopColor: column.color }}
      >
        <span className="text-sm font-semibold text-text-heading">
          {column.label}
        </span>
        <Badge variant="secondary" className="text-xs h-5">
          {cards.length}
        </Badge>
      </div>
      <Droppable droppableId={column.key}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-b-lg border-b border-x border-border p-2 space-y-2 min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? "bg-primary-accent/5" : "bg-card"
            }`}
          >
            {cards.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-xs text-text-muted italic">
                Drop players here
              </div>
            ) : (
              cards.map((card, idx) => (
                <ScoutingCardItem
                  key={card.id}
                  card={card}
                  index={idx}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function ScoutingBoard() {
  const [data, setData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/scouting");
      if (!res.ok) throw new Error("Failed to load board");
      const board = await res.json();
      setData(board);
    } catch (err) {
      toast.error("Failed to load scouting board");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!data || !result.destination) return;

      const { source, destination, draggableId } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const newStatus = destination.droppableId;
      const prevStatus = source.droppableId;

      // Optimistic update
      const updatedCards = [...data.cards];
      const movedIdx = updatedCards.findIndex((c) => c.id === draggableId);
      if (movedIdx === -1) return;

      const movedCard = { ...updatedCards[movedIdx], status: newStatus };
      updatedCards.splice(movedIdx, 1);

      // Insert at new position within same-status group
      const sameStatusCards = updatedCards.filter((c) => c.status === newStatus);
      const beforeCount = updatedCards.findIndex((c) => c.status === newStatus);
      const insertIdx = beforeCount + destination.index;
      updatedCards.splice(insertIdx, 0, movedCard);

      setData({ ...data, cards: updatedCards });

      // Persist
      try {
        const res = await fetch(`/api/scouting/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error();
      } catch {
        toast.error("Failed to move card");
        fetchBoard(); // rollback
      }
    },
    [data, fetchBoard]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!data) return;
      if (!confirm("Remove this player from your scouting board?")) return;

      setData({ ...data, cards: data.cards.filter((c) => c.id !== id) });

      try {
        const res = await fetch(`/api/scouting/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Removed from board");
      } catch {
        toast.error("Failed to remove");
        fetchBoard();
      }
    },
    [data, fetchBoard]
  );

  const handleUpdate = useCallback(
    async (id: string, patch: Partial<ScoutingCardData>) => {
      if (!data) return;

      setData({
        ...data,
        cards: data.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });

      try {
        const res = await fetch(`/api/scouting/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error();
        toast.success("Updated");
      } catch {
        toast.error("Failed to update");
        fetchBoard();
      }
    },
    [data, fetchBoard]
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-2 text-text-heading font-semibold">
            <ClipboardList className="size-5 text-primary-accent" />
            Scouting Pipeline
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-accent" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-hover">
          <div className="flex items-center gap-2 text-text-heading font-semibold">
            <ClipboardList className="size-5 text-primary-accent" />
            Scouting Pipeline
          </div>
        </div>
        <EmptyState
          icon={ClipboardList}
          title="Board unavailable"
          description="Could not load your scouting board."
          actionButton={{ label: "Retry", onClick: fetchBoard }}
          className="py-8"
        />
      </div>
    );
  }

  const totalCards = data.cards.length;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-surface-hover">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-heading font-semibold">
            <ClipboardList className="size-5 text-primary-accent" />
            Scouting Pipeline
            {totalCards > 0 && (
              <Badge variant="secondary" className="text-xs h-5">
                {totalCards}
              </Badge>
            )}
          </div>
          <Link href="/players">
            <Button variant="ghost" size="sm" className="text-xs">
              <Plus className="size-3 mr-1" />
              Add Players
            </Button>
          </Link>
        </div>
      </div>

      {totalCards === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Your pipeline is empty"
          description="Add players to track them through your scouting process — from discovery to signed."
          action={{ label: "Browse players", href: "/players" }}
          className="py-10"
        />
      ) : (
        <div className="p-4 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max">
              {data.columns.map((col) => (
                <ScoutingColumnComponent
                  key={col.key}
                  column={col}
                  cards={data.cards
                    .filter((c) => c.status === col.key)
                    .sort((a, b) => a.order - b.order)}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}
