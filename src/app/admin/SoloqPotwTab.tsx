"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Zap,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

interface SoloqPOTW {
  id: string;
  playerId: string;
  player: {
    pseudo: string;
    realName: string | null;
    photoUrl: string | null;
    role: string;
  };
  week: number;
  year: number;
  lpGain: number;
  winrate: number;
  gamesPlayed: number;
  reason: string;
  isActive: boolean;
}

interface PlayerOption {
  id: string;
  pseudo: string;
  realName: string | null;
}

export default function SoloqPotwTab() {
  const [potws, setPotws] = useState<SoloqPOTW[]>([]);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SoloqPOTW | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SoloqPOTW>>({});

  useEffect(() => {
    fetchPotws();
    fetchPlayers();
  }, []);

  async function fetchPotws() {
    try {
      const res = await fetch("/api/soloq-potw?all=true");
      const data = await res.json();
      setPotws(data.potws || []);
    } catch {
      toast.error("Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlayers() {
    try {
      const res = await fetch("/api/players?limit=100");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch {
      console.error("Failed to fetch players");
    }
  }

  function startAdd() {
    setEditing(null);
    const now = new Date();
    setFormData({
      playerId: players[0]?.id || "",
      week: getWeekNumber(now),
      year: now.getFullYear(),
      lpGain: 0,
      winrate: 0,
      gamesPlayed: 0,
      reason: "",
      isActive: true,
    });
    setIsAddDialogOpen(true);
  }

  function startEdit(potw: SoloqPOTW) {
    setEditing(potw);
    setFormData({ ...potw });
  }

  async function save() {
    if (!formData.playerId || !formData.week || !formData.year) return;

    try {
      const res = await fetch("/api/soloq-potw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setEditing(null);
        setIsAddDialogOpen(false);
        fetchPotws();
        toast.success(editing ? "Updated" : "Created");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
  }

  async function deletePotw(id: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      await fetch(`/api/soloq-potw?id=${id}`, { method: "DELETE" });
      fetchPotws();
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await fetch("/api/soloq-potw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      fetchPotws();
      toast.success(current ? "Deactivated" : "Activated");
    } catch {
      toast.error("Failed to update");
    }
  }

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading...</p>;
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-[#6C757D] dark:text-gray-400">
          {potws.length} entries
        </p>
        <Button className="bg-[#1A1A2E] text-white hover:bg-[#16213E]" onClick={startAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Week
        </Button>
      </div>

      {/* Table */}
      <Card className="border-[#E9ECEF] dark:border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E9ECEF] dark:border-gray-700 bg-[#F8F9FA] dark:bg-[#1e293b]">
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">Week</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">Player</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">LP Gain</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">WR</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">Games</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">Active</th>
                  <th className="text-left p-3 text-xs font-semibold text-[#6C757D] dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {potws.map((potw) => (
                  <tr key={potw.id} className="border-b border-[#E9ECEF] dark:border-gray-700 hover:bg-[#F8F9FA] dark:hover:bg-[#1e293b]">
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        W{potw.week} {potw.year}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {potw.player.photoUrl ? (
                          <Image
                            src={potw.player.photoUrl}
                            alt={potw.player.pseudo}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1A1A2E] flex items-center justify-center text-xs font-bold text-white">
                            {(potw.player.pseudo?.[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                            {potw.player.pseudo}
                          </p>
                          <p className="text-xs text-[#6C757D] dark:text-gray-400">
                            {potw.player.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-bold text-orange-500">
                        +{potw.lpGain}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-[#6C757D] dark:text-gray-400">
                      {(potw.winrate * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-sm text-[#6C757D] dark:text-gray-400">
                      {potw.gamesPlayed}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(potw.id, potw.isActive)}
                        className={potw.isActive ? "text-green-500" : "text-gray-400"}
                      >
                        {potw.isActive ? "Active" : "Inactive"}
                      </Button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Dialog
                          open={editing?.id === potw.id}
                          onOpenChange={(open) => {
                            if (!open) setEditing(null);
                          }}
                        >
                          <DialogTrigger>
                            <div
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent cursor-pointer"
                              onClick={() => startEdit(potw)}
                            >
                              <Edit className="h-4 w-4 text-[#0F3460]" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Week {potw.week}</DialogTitle>
                            </DialogHeader>
                            <PotwForm
                              players={players}
                              formData={formData}
                              setFormData={setFormData}
                              onSave={save}
                              onCancel={() => setEditing(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deletePotw(potw.id)}
                        >
                          <Trash2 className="h-4 w-4 text-[#E94560]" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Player of SOLOQ</DialogTitle>
          </DialogHeader>
          <PotwForm
            players={players}
            formData={formData}
            setFormData={setFormData}
            onSave={save}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PotwForm({
  players,
  formData,
  setFormData,
  onSave,
  onCancel,
}: {
  players: PlayerOption[];
  formData: Partial<SoloqPOTW>;
  setFormData: (data: Partial<SoloqPOTW>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Player *</Label>
        <Select
          value={formData.playerId || ""}
          onValueChange={(v) => setFormData({ ...formData, playerId: v || "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select player" />
          </SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.pseudo} {p.realName ? `(${p.realName})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="week">Week *</Label>
          <Input
            id="week"
            type="number"
            value={formData.week || ""}
            onChange={(e) => setFormData({ ...formData, week: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            value={formData.year || ""}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lpGain">LP Gain</Label>
          <Input
            id="lpGain"
            type="number"
            value={formData.lpGain || ""}
            onChange={(e) => setFormData({ ...formData, lpGain: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="winrate">Winrate (0-1)</Label>
          <Input
            id="winrate"
            type="number"
            step="0.01"
            value={formData.winrate || ""}
            onChange={(e) => setFormData({ ...formData, winrate: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gamesPlayed">Games</Label>
          <Input
            id="gamesPlayed"
            type="number"
            value={formData.gamesPlayed || ""}
            onChange={(e) => setFormData({ ...formData, gamesPlayed: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Why them? (placeholder)</Label>
        <Textarea
          id="reason"
          value={formData.reason || ""}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g. Climbed from GM to Challenger in 3 days..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button className="bg-[#1A1A2E] text-white hover:bg-[#16213E]" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
}

