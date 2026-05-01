"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";

import { LEAGUES } from "@/lib/constants";
const SEASONS = ["2024", "2025", "2026", "2027"];
const SPLITS = ["Spring", "Summer", "Winter", "Playoffs"];

export default function ImportCsvPage() {
  const [file, setFile] = useState<File | null>(null);
  const [league, setLeague] = useState("ROL");
  const [season, setSeason] = useState("2026");
  const [split, setSplit] = useState("Winter");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    players: string[];
    errors: string[];
    detectedMetrics?: string[];
  } | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) {
      setFile(dropped);
      setResult(null);
    } else {
      toast.error("Please drop a .csv file");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("league", league);
    formData.append("season", season);
    formData.append("split", split);

    try {
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
      } else {
        setResult(data);
        toast.success(`Import complete! ${data.created} created, ${data.updated} updated`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-text-muted hover:text-text-heading transition-colors">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-text-heading mt-4 mb-1">Import Players from CSV</h1>
          <p className="text-sm text-text-muted">
            Upload a CSV file to bulk-import players with their stats. New players will be marked as{" "}
            <span className="text-orange-400 font-medium">Scouting</span>.
          </p>
        </div>

        <Card className="border-border bg-surface-hover">
          <CardHeader>
            <CardTitle className="text-lg text-text-heading">CSV Import</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary-accent hover:bg-primary-accent/5 transition-colors cursor-pointer"
                onClick={() => document.getElementById("csv-file")?.click()}
              >
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setResult(null);
                    }
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary-accent" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-text-heading">{file.name}</p>
                      <p className="text-xs text-text-muted">
                        {(file.size / 1024).toFixed(1)} KB — Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-subtle">
                      Drop a CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Supports: Player,Team,Pos,Games,KDA,CSD@15,GD@15,DPM,KP%,etc.
                    </p>
                  </>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-text-subtle">League</Label>
                  <Select value={league} onValueChange={(v) => v && setLeague(v)}>
                    <SelectTrigger className="bg-card border-border text-text-heading">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-hover border-border">
                      {LEAGUES.map((l) => (
                        <SelectItem key={l} value={l} className="text-text-heading">
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-text-subtle">Season</Label>
                  <Select value={season} onValueChange={(v) => v && setSeason(v)}>
                    <SelectTrigger className="bg-card border-border text-text-heading">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-hover border-border">
                      {SEASONS.map((s) => (
                        <SelectItem key={s} value={s} className="text-text-heading">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-text-subtle">Split</Label>
                  <Select value={split} onValueChange={(v) => v && setSplit(v)}>
                    <SelectTrigger className="bg-card border-border text-text-heading">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-hover border-border">
                      {SPLITS.map((s) => (
                        <SelectItem key={s} value={s} className="text-text-heading">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary-accent text-text-heading hover:bg-primary-accent/90"
                disabled={loading || !file}
              >
                {loading ? "Importing..." : "Import Players"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-border bg-surface-hover mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-text-heading">Import Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-card rounded-lg p-4 text-center border border-border">
                  <UserPlus className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-text-heading">{result.created}</p>
                  <p className="text-xs text-text-muted">Created</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center border border-border">
                  <UserCheck className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-text-heading">{result.updated}</p>
                  <p className="text-xs text-text-muted">Updated</p>
                </div>
                <div className="bg-card rounded-lg p-4 text-center border border-border">
                  <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-text-heading">{result.errors.length}</p>
                  <p className="text-xs text-text-muted">Errors</p>
                </div>
              </div>

              {result.detectedMetrics && result.detectedMetrics.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-subtle mb-2">
                    Detected Metrics ({result.detectedMetrics.length})
                  </h4>
                  <div className="bg-card rounded-lg border border-border p-3">
                    <div className="flex flex-wrap gap-2">
                      {result.detectedMetrics.map((m) => (
                        <span
                          key={m}
                          className="inline-flex items-center gap-1 text-xs bg-primary-accent/10 text-primary-accent px-2 py-1 rounded"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.players.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text-subtle mb-2">
                    Players imported ({result.players.length})
                  </h4>
                  <div className="bg-card rounded-lg border border-border p-3 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {result.players.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 text-xs bg-muted text-text-subtle px-2 py-1 rounded"
                        >
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-subtle mb-2">Errors</h4>
                  <div className="bg-card rounded-lg border border-red-500/20 p-3 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-400 py-1">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
