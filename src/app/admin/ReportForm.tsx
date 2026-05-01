"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, X } from "lucide-react";

interface Player {
  id: string;
  pseudo: string;
}

interface Report {
  id: string;
  playerId: string;
  title: string;
  content: string;
  strengths: string;
  weaknesses: string;
  verdict: string;
  author: string;
  isPremium: boolean;
  publishedAt: string;
}

const VERDICT_OPTIONS = [
  { value: "Must Sign", label: "Must Sign" },
  { value: "Monitor", label: "Monitor" },
  { value: "Pass", label: "Pass" },
];

interface ReportFormProps {
  players: Player[];
  formData: Partial<Report>;
  setFormData: (data: Partial<Report>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ReportForm({
  players,
  formData,
  setFormData,
  onSave,
  onCancel,
}: ReportFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="reportPlayer">Player *</Label>
        <Select
          value={formData.playerId || ""}
          onValueChange={(v: string | null) => setFormData({ ...formData, playerId: v || "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a player" />
          </SelectTrigger>
          <SelectContent>
            {players.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.pseudo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportTitle">Title *</Label>
        <Input
          id="reportTitle"
          value={formData.title || ""}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Scouting Report: Adam"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportContent">Content</Label>
        <Textarea
          id="reportContent"
          value={formData.content || ""}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Detailed analysis..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportStrengths">Strengths (comma-separated)</Label>
        <Textarea
          id="reportStrengths"
          value={formData.strengths || ""}
          onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
          placeholder="Strong laning, Good macro, ..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportWeaknesses">Weaknesses (comma-separated)</Label>
        <Textarea
          id="reportWeaknesses"
          value={formData.weaknesses || ""}
          onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
          placeholder="Champion pool, Roaming, ..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reportVerdict">Verdict *</Label>
          <Select
            value={formData.verdict || "Monitor"}
            onValueChange={(v: string | null) => setFormData({ ...formData, verdict: v || "Monitor" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERDICT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportAuthor">Author *</Label>
          <Input
            id="reportAuthor"
            value={formData.author || ""}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Scout Name"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Checkbox
          id="reportIsPremium"
          checked={formData.isPremium || false}
          onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked === true })}
        />
        <Label htmlFor="reportIsPremium" className="cursor-pointer">
          Premium Report
        </Label>
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
