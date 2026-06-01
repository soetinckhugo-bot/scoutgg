"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Film, Plus, Trash2, Edit, Trophy, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Clip {
  id: string;
  playerName: string;
  playerRole: string;
  title: string;
  platform: string;
  videoId: string;
  monthPeriod: string;
  isActive: boolean;
  isWinner: boolean;
  adminNotes: string | null;
  totalVotes: number;
  avgScore: number;
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

export default function ClipsTab() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<{
    playerName: string;
    playerRole: string;
    title: string;
    platform: string;
    videoId: string;
    monthPeriod: string;
    isActive: boolean;
    adminNotes: string | null;
  }>({
    playerName: "",
    playerRole: "TOP",
    title: "",
    platform: "youtube",
    videoId: "",
    monthPeriod: new Date().toISOString().slice(0, 7),
    isActive: true,
    adminNotes: "",
  });

  const fetchClips = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clips");
    const data = await res.json();
    setClips(data.clips || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  async function createClip(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Clip créé");
      setIsAddOpen(false);
      fetchClips();
    } else {
      toast.error("Erreur lors de la création");
    }
  }

  async function updateClip(id: string, patch: Partial<Clip>) {
    const res = await fetch(`/api/admin/clips/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      toast.success("Clip mis à jour");
      fetchClips();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function deleteClip(id: string) {
    if (!confirm("Supprimer ce clip ?")) return;
    const res = await fetch(`/api/admin/clips/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Clip supprimé");
      fetchClips();
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-heading flex items-center gap-2">
          <Film className="h-5 w-5 text-primary-accent" />
          Clip of the Month
        </h2>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary-accent hover:bg-primary-accent/90 text-text-heading">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-text-heading">Nouveau clip</DialogTitle>
            </DialogHeader>
            <form onSubmit={createClip} className="space-y-4">
              <div>
                <Label className="text-text-body">Pseudo</Label>
                <Input value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} className="bg-surface text-text-heading border-border" required />
              </div>
              <div>
                <Label className="text-text-body">Rôle</Label>
                <Select value={form.playerRole} onValueChange={(v) => setForm({ ...form, playerRole: v || "TOP" })}>
                  <SelectTrigger className="bg-surface text-text-heading border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-text-body">Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-surface text-text-heading border-border" required />
              </div>
              <div>
                <Label className="text-text-body">Plateforme</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v || "youtube" })}>
                  <SelectTrigger className="bg-surface text-text-heading border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-text-body">Video ID</Label>
                <Input value={form.videoId} onChange={(e) => setForm({ ...form, videoId: e.target.value })} className="bg-surface text-text-heading border-border" placeholder={form.platform === "youtube" ? "dQw4w9WgXcQ" : "1234567890"} required />
              </div>
              <div>
                <Label className="text-text-body">Mois (YYYY-MM)</Label>
                <Input value={form.monthPeriod} onChange={(e) => setForm({ ...form, monthPeriod: e.target.value })} className="bg-surface text-text-heading border-border" pattern="\d{4}-\d{2}" required />
              </div>
              <div>
                <Label className="text-text-body">Notes admin</Label>
                <Input value={form.adminNotes || ""} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} className="bg-surface text-text-heading border-border" />
              </div>
              <Button type="submit" className="w-full bg-primary-accent hover:bg-primary-accent/90 text-text-heading">Créer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-text-muted">Chargement...</p>
      ) : clips.length === 0 ? (
        <p className="text-text-muted">Aucun clip.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-hover text-text-body">
                <tr>
                  <th className="px-4 py-3 text-left">Titre</th>
                  <th className="px-4 py-3 text-left">Joueur</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Mois</th>
                  <th className="px-4 py-3 text-left">Actif</th>
                  <th className="px-4 py-3 text-left">Gagnant</th>
                  <th className="px-4 py-3 text-left">Votes</th>
                  <th className="px-4 py-3 text-left">Moyenne</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clips.map((clip) => (
                  <tr key={clip.id} className="hover:bg-surface-hover/50">
                    <td className="px-4 py-3 text-text-heading font-medium">{clip.title}</td>
                    <td className="px-4 py-3 text-text-body">{clip.playerName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs bg-surface-hover text-text-body">{clip.playerRole}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{clip.monthPeriod}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateClip(clip.id, { isActive: !clip.isActive })}
                        className={clip.isActive ? "text-success" : "text-text-muted"}
                      >
                        {clip.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateClip(clip.id, { isWinner: !clip.isWinner })}
                        className={clip.isWinner ? "text-yellow-500" : "text-text-muted"}
                      >
                        <Trophy className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{clip.totalVotes}</td>
                    <td className="px-4 py-3 text-text-muted">{clip.avgScore}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => deleteClip(clip.id)} className="text-tier-d hover:text-tier-d">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
