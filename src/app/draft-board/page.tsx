"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GripVertical,
  Plus,
  X,
  Loader2,
  Target,
  Crown,
  Eye,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS } from "@/lib/constants";

interface BoardPlayer {
  id: string;
  playerId: string;
  pseudo: string;
  role: string;
  league: string;
  photoUrl: string | null;
  prospectScore: number | null;
  priority: number;
}

interface Column {
  id: string;
  title: string;
  color: string;
  players: BoardPlayer[];
}

const DEFAULT_COLUMNS: Column[] = [
  { id: "must-sign", title: "Must Sign", color: "#28A745", players: [] },
  { id: "monitor", title: "Monitor", color: "#FFC107", players: [] },
  { id: "backup", title: "Backup Option", color: "#0F3460", players: [] },
  { id: "pass", title: "Pass", color: "#DC3545", players: [] },
];

export default function DraftBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [allPlayers, setAllPlayers] = useState<BoardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("must-sign");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchPlayers();
    }
  }, [status, router]);

  async function fetchPlayers() {
    try {
      const res = await fetch("/api/players?limit=200");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const mapped = data.players.map((p: any) => ({
        id: `bp-${p.id}`,
        playerId: p.id,
        pseudo: p.pseudo,
        role: p.role,
        league: p.league,
        photoUrl: p.photoUrl,
        prospectScore: p.prospectScore,
        priority: 0,
      }));
      setAllPlayers(mapped);
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reorder within same column
      const col = columns.find((c) => c.id === source.droppableId);
      if (!col) return;

      const items = Array.from(col.players);
      const [reordered] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reordered);

      setColumns(
        columns.map((c) =>
          c.id === source.droppableId ? { ...c, players: items } : c
        )
      );
    } else {
      // Move between columns
      const sourceCol = columns.find((c) => c.id === source.droppableId);
      const destCol = columns.find((c) => c.id === destination.droppableId);
      if (!sourceCol || !destCol) return;

      const sourceItems = Array.from(sourceCol.players);
      const [moved] = sourceItems.splice(source.index, 1);
      const destItems = Array.from(destCol.players);
      destItems.splice(destination.index, 0, moved);

      setColumns(
        columns.map((c) => {
          if (c.id === source.droppableId) return { ...c, players: sourceItems };
          if (c.id === destination.droppableId) return { ...c, players: destItems };
          return c;
        })
      );
    }
  }

  function addPlayer() {
    if (!selectedPlayer) return;
    const player = allPlayers.find((p) => p.playerId === selectedPlayer);
    if (!player) return;

    const alreadyAdded = columns.some((col) =>
      col.players.some((p) => p.playerId === selectedPlayer)
    );
    if (alreadyAdded) {
      toast.error("Player already on board");
      return;
    }

    setColumns(
      columns.map((col) =>
        col.id === selectedColumn
          ? { ...col, players: [...col.players, player] }
          : col
      )
    );
    setSelectedPlayer("");
    toast.success(`Added ${player.pseudo} to ${columns.find((c) => c.id === selectedColumn)?.title}`);
  }

  function removePlayer(columnId: string, playerId: string) {
    setColumns(
      columns.map((col) =>
        col.id === columnId
          ? { ...col, players: col.players.filter((p) => p.playerId !== playerId) }
          : col
      )
    );
  }

  const filteredPlayers = allPlayers.filter(
    (p) =>
      p.pseudo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !columns.some((col) => col.players.some((cp) => cp.playerId === p.playerId))
  );

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#E94560]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-1">
            Draft Priority Board
          </h1>
          <p className="text-[#6C757D] dark:text-gray-400">
            Drag and drop players to organize your scouting priorities
          </p>
        </div>
      </div>

      {/* Add Player */}
      <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 mb-6 bg-muted/50">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              <Select value={selectedPlayer} onValueChange={(v) => setSelectedPlayer(v || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlayers.slice(0, 20).map((p) => (
                    <SelectItem key={p.playerId} value={p.playerId}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{p.pseudo}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 px-1 ${ROLE_COLORS[p.role] || ""}`}
                        >
                          {p.role}
                        </Badge>
                        <span className="text-[#6C757D] dark:text-gray-400 text-xs">
                          {p.league}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={selectedColumn} onValueChange={(v) => setSelectedColumn(v || "must-sign")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={addPlayer}
              disabled={!selectedPlayer}
              className="bg-[#1A1A2E] text-white hover:bg-[#16213E]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id}>
              <div
                className="flex items-center gap-2 mb-3 px-1"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-semibold text-[#1A1A2E] dark:text-white">
                  {column.title}
                </h3>
                <Badge
                  variant="secondary"
                  className="text-xs h-4 bg-[#F8F9FA] dark:bg-[#1e293b]"
                >
                  <span className="tabular-nums">{column.players.length}</span>
                </Badge>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-lg border-2 border-dashed p-2 transition-colors ${
                      snapshot.isDraggingOver
                        ? "border-[#0F3460] bg-blue-50/50 dark:bg-blue-900/10"
                        : "border-[#E9ECEF] dark:border-gray-700"
                    }`}
                  >
                    {column.players.map((player, index) => (
                      <Draggable
                        key={player.id}
                        draggableId={player.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 ${snapshot.isDragging ? "opacity-50" : ""}`}
                          >
                            <div className="rounded-lg border border-[#E9ECEF] dark:border-gray-700 hover:shadow-sm transition-shadow bg-white dark:bg-[#0f172a]">
                              <div className="p-3">
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-[#E9ECEF] dark:text-gray-600 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={`/players/${player.playerId}`}
                                        className="font-medium text-sm text-[#1A1A2E] dark:text-white hover:text-[#E94560] truncate"
                                      >
                                        {player.pseudo}
                                      </Link>
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs h-3.5 px-1 ${ROLE_COLORS[player.role] || ""}`}
                                      >
                                        {player.role}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-gray-400">
                                      {player.league}
                                      {player.prospectScore && (
                                        <span className="ml-1 text-[#E94560]">
                                          · <span className="tabular-nums">{player.prospectScore.toFixed(1)}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePlayer(column.id, player.playerId)}
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

