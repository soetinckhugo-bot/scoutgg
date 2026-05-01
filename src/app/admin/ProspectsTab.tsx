"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ROLES } from "@/lib/constants";

interface ProspectPlayer {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  nationality: string;
  age: number | null;
  currentTeam: string | null;
  league: string;
  status: string;
  photoUrl: string | null;
  prospectPhotoUrl: string | null;
  isProspect: boolean;
  hasPlayedInMajorLeague: boolean;
  peakElo2Years: number | null;
  bestProResult: string | null;
  eyeTestRating: number | null;
  prospectScore: number | null;
  prospectRank: number | null;
  prospectTrend: string | null;
  soloqStats?: {
    currentRank: string;
    peakLp: number;
    winrate: number;
    totalGames: number;
    championPool: string;
  } | null;
  proStats?: {
    kda: number | null;
    championPool: string | null;
    gamesPlayed: number | null;
    season: string;
  } | null;
}

const TREND_OPTIONS = [
  { value: "up", label: "▲ Up", color: "text-green-500" },
  { value: "down", label: "▼ Down", color: "text-red-500" },
  { value: "stable", label: "▬ Stable", color: "text-text-body" },
  { value: "new", label: "✦ New", color: "text-blue-500" },
];

const LEAGUE_OPTIONS = ["LFL", "LFL_D2", "LVP", "Prime League", "NLC", "Ultraliga", "Hitpoint Masters", "EBL", "GLL"];
const STATUS_OPTIONS = ["ACADEMY", "UNDER_CONTRACT", "FREE_AGENT"];

export default function ProspectsTab() {
  const [prospects, setProspects] = useState<ProspectPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProspect, setEditingProspect] = useState<ProspectPlayer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProspectPlayer>>({});

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    try {
      const res = await fetch("/api/prospects?limit=50");
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (error) {
      logger.error("Error fetching prospects", { error });
      toast.error("Failed to fetch prospects");
    } finally {
      setLoading(false);
    }
  }

  async function recalculateScores() {
    try {
      const res = await fetch("/api/prospects/recalculate", { method: "POST" });
      if (res.ok) {
        toast.success("Scores recalculated");
        fetchProspects();
      } else {
        toast.error("Failed to recalculate");
      }
    } catch (error) {
      toast.error("Failed to recalculate");
    }
  }

  function startEdit(player: ProspectPlayer) {
    setEditingProspect(player);
    setFormData({ ...player });
  }

  function startAdd() {
    setEditingProspect(null);
    setFormData({
      pseudo: "",
      realName: "",
      role: "TOP",
      nationality: "",
      age: 19,
      currentTeam: "",
      league: "LFL",
      status: "ACADEMY",
      isProspect: true,
      hasPlayedInMajorLeague: false,
      peakElo2Years: null,
      bestProResult: "",
      eyeTestRating: null,
      prospectRank: null,
      prospectTrend: "new",
      prospectScore: 0,
    });
    setIsAddDialogOpen(true);
  }

  async function saveProspect() {
    if (!formData.pseudo) return;

    try {
      const url = editingProspect
        ? `/api/players/${editingProspect.id}`
        : "/api/players";
      const method = editingProspect ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isProspect: true,
        }),
      });

      if (res.ok) {
        setEditingProspect(null);
        setIsAddDialogOpen(false);
        fetchProspects();
        toast.success(editingProspect ? "Prospect updated" : "Prospect added");
      } else {
        toast.error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save");
    }
  }

  async function deleteProspect(id: string) {
    if (!confirm("Remove this player from prospects?")) return;
    try {
      await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProspect: false, prospectScore: null }),
      });
      fetchProspects();
      toast.success("Removed from prospects");
    } catch (error) {
      toast.error("Failed to remove");
    }
  }

  async function toggleProspect(id: string, current: boolean) {
    try {
      await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isProspect: !current }),
      });
      fetchProspects();
      toast.success(current ? "Removed from prospects" : "Added to prospects");
    } catch (error) {
      toast.error("Failed to update");
    }
  }

  const filtered = prospects.filter(
    (p) =>
      p.pseudo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currentTeam?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <p className="text-center text-text-body py-8">Loading prospects...</p>;
  }

  return (
    <div>
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            placeholder="Search prospects..."
            className="pl-10 bg-card border-border text-text-heading"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={recalculateScores}
            className="border-border"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
          <Button
            className="bg-surface-elevated text-text-heading hover:bg-secondary"
            onClick={startAdd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-text-heading">{prospects.length}</p>
            <p className="text-sm text-text-body">Total Prospects</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {prospects.filter((p) => p.prospectTrend === "up" || p.prospectTrend === "new").length}
            </p>
            <p className="text-sm text-text-body">Rising / New</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary-accent">
              {prospects.filter((p) => p.prospectTrend === "down").length}
            </p>
            <p className="text-sm text-text-body">Declining</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-500">
              {prospects[0]?.prospectScore?.toFixed(0) || "—"}
            </p>
            <p className="text-sm text-text-body">Top Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Prospects Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Rank</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Trend</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Player</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Role</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Age</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Team</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">League</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Score</th>
                  <th className="text-left p-3 text-xs font-semibold text-text-body uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-border hover:bg-card"
                  >
                    <td className="p-3">
                      <span className="text-sm font-bold text-text-heading">
                        #{player.prospectRank || "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      {player.prospectTrend === "up" && (
                        <span className="flex items-center gap-1 text-green-500 text-xs font-bold">
                          <TrendingUp className="h-3.5 w-3.5" /> Up
                        </span>
                      )}
                      {player.prospectTrend === "down" && (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-bold">
                          <TrendingDown className="h-3.5 w-3.5" /> Down
                        </span>
                      )}
                      {player.prospectTrend === "stable" && (
                        <span className="flex items-center gap-1 text-text-body text-xs">
                          <Minus className="h-3.5 w-3.5" /> Stable
                        </span>
                      )}
                      {player.prospectTrend === "new" && (
                        <span className="flex items-center gap-1 text-blue-500 text-xs font-bold">
                          <Sparkles className="h-3.5 w-3.5" /> New
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {player.prospectPhotoUrl || player.photoUrl ? (
                          <Image
                            src={player.prospectPhotoUrl || player.photoUrl!}
                            alt={player.pseudo}
                            width={36}
                            height={36}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-text-heading">
                            {(player.pseudo?.[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-heading text-sm">
                            {player.pseudo}
                          </p>
                          {player.realName && (
                            <p className="text-xs text-text-body">
                              {player.realName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">
                        {player.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-text-body">
                      {player.age || "—"}
                    </td>
                    <td className="p-3 text-sm text-text-body">
                      {player.currentTeam || "—"}
                    </td>
                    <td className="p-3 text-sm text-text-body">
                      {player.league}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-bold text-yellow-500">
                        {player.prospectScore?.toFixed(0) || "—"}
                      </span>
                      <span className="text-xs text-text-body">/100</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Dialog
                          open={editingProspect?.id === player.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingProspect(null);
                          }}
                        >
                          <DialogTrigger>
                            <div
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-surface-hover cursor-pointer"
                              onClick={() => startEdit(player)}
                            >
                              <Edit className="h-4 w-4 text-accent" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Prospect: {player.pseudo}</DialogTitle>
                            </DialogHeader>
                            <ProspectForm
                              formData={formData}
                              setFormData={setFormData}
                              onSave={saveProspect}
                              onCancel={() => setEditingProspect(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteProspect(player.id)}
                        >
                          <Trash2 className="h-4 w-4 text-primary-accent" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Prospect</DialogTitle>
          </DialogHeader>
          <ProspectForm
            formData={formData}
            setFormData={setFormData}
            onSave={saveProspect}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProspectForm({
  formData,
  setFormData,
  onSave,
  onCancel,
}: {
  formData: Partial<ProspectPlayer>;
  setFormData: (data: Partial<ProspectPlayer>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pseudo">Pseudo *</Label>
          <Input
            id="pseudo"
            value={formData.pseudo || ""}
            onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
            placeholder="Player name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="realName">Real Name</Label>
          <Input
            id="realName"
            value={formData.realName || ""}
            onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role || "TOP"}
            onValueChange={(v) => setFormData({ ...formData, role: v || "TOP" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality || ""}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="FR, KR, DE..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age || ""}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
            placeholder="19"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentTeam">Current Team</Label>
          <Input
            id="currentTeam"
            value={formData.currentTeam || ""}
            onChange={(e) => setFormData({ ...formData, currentTeam: e.target.value })}
            placeholder="Team name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="league">League *</Label>
          <Select
            value={formData.league || "LFL"}
            onValueChange={(v) => setFormData({ ...formData, league: v || "LFL" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAGUE_OPTIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status || "ACADEMY"}
            onValueChange={(v) => setFormData({ ...formData, status: v || "ACADEMY" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="peakElo2Years">Peak ELO (2 years)</Label>
          <Input
            id="peakElo2Years"
            type="number"
            value={formData.peakElo2Years || ""}
            onChange={(e) => setFormData({ ...formData, peakElo2Years: parseInt(e.target.value) || null })}
            placeholder="e.g. 1200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bestProResult">Best Pro Result</Label>
          <Input
            id="bestProResult"
            value={formData.bestProResult || ""}
            onChange={(e) => setFormData({ ...formData, bestProResult: e.target.value })}
            placeholder="Winner, Final, Semi..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eyeTestRating">Eye Test (0-5)</Label>
          <Input
            id="eyeTestRating"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={formData.eyeTestRating || ""}
            onChange={(e) => setFormData({ ...formData, eyeTestRating: parseFloat(e.target.value) || null })}
            placeholder="0 to 5"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Checkbox
            id="hasPlayedInMajorLeague"
            checked={formData.hasPlayedInMajorLeague || false}
            onCheckedChange={(checked) => setFormData({ ...formData, hasPlayedInMajorLeague: checked === true })}
          />
          <Label htmlFor="hasPlayedInMajorLeague" className="cursor-pointer text-xs text-text-muted">
            Has played in T1/T2 major league
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prospectRank">Rank</Label>
          <Input
            id="prospectRank"
            type="number"
            value={formData.prospectRank || ""}
            onChange={(e) => setFormData({ ...formData, prospectRank: parseInt(e.target.value) || null })}
            placeholder="1-30"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prospectTrend">Trend</Label>
          <Select
            value={formData.prospectTrend || "stable"}
            onValueChange={(v) => setFormData({ ...formData, prospectTrend: v || "stable" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TREND_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="prospectPhotoUrl">Prospect Photo URL</Label>
          <Input
            id="prospectPhotoUrl"
            value={formData.prospectPhotoUrl || ""}
            onChange={(e) => setFormData({ ...formData, prospectPhotoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button className="bg-surface-elevated text-text-heading hover:bg-secondary" onClick={onSave}>
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

