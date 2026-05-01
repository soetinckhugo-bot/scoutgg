"use client";

import { useState, useEffect, useCallback, memo, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Users,
  FileText,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Search,
  ExternalLink,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  FileSpreadsheet,
  BarChart3,
  Tag,
  RefreshCw,
  Calendar,
  Loader2,
  Bell,
  Upload,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { ROLE_COLORS, STATUS_COLORS, ROLES, LEAGUES, TIERS, TIER_LABELS, STATUSES } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import ProspectsTab from "./ProspectsTab";
import SoloqPotwTab from "./SoloqPotwTab";
import OracleImportTab from "./OracleImportTab";
import ProStatsForm from "./ProStatsForm";
import BehaviorTagsForm from "./BehaviorTagsForm";
import ReportForm from "./ReportForm";
import { PageTitle, SectionHeader, DataLabel, DataValue } from "@/components/ui/typography";

interface Player {
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  nationality: string;
  age: number | null;
  currentTeam: string | null;
  league: string;
  tier: string | null;
  status: string;
  opggUrl: string | null;
  golggUrl: string | null;
  lolprosUrl: string | null;
  leaguepediaUrl: string | null;
  twitterUrl: string | null;
  agentTwitterUrl: string | null;
  twitchUrl: string | null;
  riotId: string | null;
  riotPuuid: string | null;
  photoUrl: string | null;
  bio: string | null;
  contractEndDate: string | null;
  hasPlayedInMajorLeague: boolean;
  peakElo2Years: number | null;
  bestProResult: string | null;
  eyeTestRating: number | null;
  isFeatured: boolean;
  isProspect: boolean;
  soloqStats?: {
    currentRank: string;
    peakLp: number;
    winrate: number;
    totalGames: number;
  } | null;
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
  player: {
    pseudo: string;
  };
}

const VERDICT_COLORS: Record<string, string> = {
  "Must Sign": "bg-green-100 text-green-800 border-green-200",
  "Monitor": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Pass": "bg-red-100 text-red-800 border-red-200",
};

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportSearchQuery, setReportSearchQuery] = useState("");

  // Pagination state
  const [playersPage, setPlayersPage] = useState(1);
  const [playersTotalPages, setPlayersTotalPages] = useState(1);
  const [playersTotal, setPlayersTotal] = useState(0);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Report form state
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isAddReportDialogOpen, setIsAddReportDialogOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState<Partial<Report>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<Player>>({});

  const fetchPlayers = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`/api/players?page=${page}&limit=10`);
      const data = await res.json();
      setPlayers(data.players);
      setPlayersPage(data.pagination.page);
      setPlayersTotalPages(data.pagination.totalPages);
      setPlayersTotal(data.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching players:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`/api/reports?page=${page}&limit=10`);
      const data = await res.json();
      setReports(data.reports);
      setReportsPage(data.pagination.page);
      setReportsTotalPages(data.pagination.totalPages);
      setReportsTotal(data.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  }, []);

  // Memoized stats
  const stats = useMemo(() => ({
    totalPlayers: playersTotal,
    freeAgents: players.filter((p) => p.status === "FREE_AGENT").length,
    lecPlayers: players.filter((p) => p.league === "LEC").length,
    featuredCount: players.filter((p) => p.isFeatured).length,
    reportsCount: reports.length,
  }), [players, playersTotal, reports]);

  useEffect(() => {
    fetchPlayers();
    fetchReports();
  }, [fetchPlayers, fetchReports]);

  const startEdit = useCallback((player: Player) => {
    setEditingPlayer(player);
    setFormData({ ...player });
  }, []);

  const startAdd = useCallback(() => {
    setEditingPlayer(null);
    setFormData({
      pseudo: "",
      realName: "",
      role: "TOP",
      nationality: "",
      age: null,
      currentTeam: "",
      league: "LEC",
      tier: null,
      status: "SCOUTING",
      opggUrl: "",
      golggUrl: "",
      lolprosUrl: "",
      leaguepediaUrl: "",
      twitterUrl: "",
      agentTwitterUrl: "",
      twitchUrl: "",
      riotId: "",
      photoUrl: "",
      bio: "",
      hasPlayedInMajorLeague: false,
      peakElo2Years: null,
      bestProResult: "",
      eyeTestRating: null,
      isFeatured: false,
      isProspect: false,
    });
    setIsAddDialogOpen(true);
  }, []);

  const savePlayer = useCallback(async () => {
    if (!formData.pseudo) return;

    try {
      const url = editingPlayer 
        ? `/api/players/${editingPlayer.id}` 
        : "/api/players";
      const method = editingPlayer ? "PUT" : "POST";

      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age as any, 10) : null,
        tier: formData.tier || null,
        // Convert empty strings to null for URL fields to pass Zod validation
        opggUrl: formData.opggUrl || null,
        golggUrl: formData.golggUrl || null,
        lolprosUrl: formData.lolprosUrl || null,
        leaguepediaUrl: formData.leaguepediaUrl || null,
        twitterUrl: formData.twitterUrl || null,
        agentTwitterUrl: formData.agentTwitterUrl || null,
        twitchUrl: formData.twitchUrl || null,
        photoUrl: formData.photoUrl || null,
        hasPlayedInMajorLeague: formData.hasPlayedInMajorLeague ?? false,
        peakElo2Years: formData.peakElo2Years ?? null,
        bestProResult: formData.bestProResult || null,
        eyeTestRating: formData.eyeTestRating ?? null,
        isProspect: formData.isProspect ?? false,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingPlayer(null);
        setIsAddDialogOpen(false);
        fetchPlayers();
        toast.success(editingPlayer ? "Player updated" : "Player added successfully");
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Save player failed:", err);
        toast.error(err.error || "Failed to save player");
      }
    } catch (error) {
      console.error("Error saving player:", error);
      toast.error("Failed to save player");
    }
  }, [formData, editingPlayer, fetchPlayers]);

  const deletePlayer = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this player?")) return;
    try {
      await fetch(`/api/players/${id}`, { method: "DELETE" });
      fetchPlayers();
      toast.success("Player deleted");
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.error("Failed to delete player");
    }
  }, [fetchPlayers]);

  const toggleFeatured = useCallback(async (id: string, current: boolean) => {
    try {
      await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !current }),
      });
      fetchPlayers();
      toast.success(current ? "POTM removed" : "Player set as POTM");
    } catch (error) {
      console.error("Error updating POTM:", error);
      toast.error("Failed to update POTM");
    }
  }, [fetchPlayers]);

  const syncSoloq = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/riot/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchPlayers();
        toast.success(`SoloQ synced! ${data.data.soloqStats.currentRank}`);
      } else {
        toast.error(data.error || "Failed to sync SoloQ");
      }
    } catch (error) {
      console.error("Error syncing SoloQ:", error);
      toast.error("Failed to sync SoloQ");
    }
  }, [fetchPlayers]);

  // Report functions
  const startAddReport = useCallback(() => {
    setEditingReport(null);
    setReportFormData({
      playerId: players[0]?.id || "",
      title: "",
      content: "",
      strengths: "",
      weaknesses: "",
      verdict: "Monitor",
      author: "",
      isPremium: false,
    });
    setIsAddReportDialogOpen(true);
  }, [players]);

  const startEditReport = useCallback((report: Report) => {
    setEditingReport(report);
    setReportFormData({ ...report });
  }, []);

  const saveReport = useCallback(async () => {
    if (!reportFormData.playerId || !reportFormData.title || !reportFormData.verdict) return;

    try {
      const url = editingReport
        ? `/api/reports/${editingReport.id}`
        : "/api/reports";
      const method = editingReport ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportFormData),
      });

      if (res.ok) {
        setEditingReport(null);
        setIsAddReportDialogOpen(false);
        fetchReports();
        toast.success(editingReport ? "Report updated" : "Report added successfully");
      } else {
        toast.error("Failed to save report");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    }
  }, [reportFormData, editingReport, fetchReports]);

  const deleteReport = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      fetchReports();
      toast.success("Report deleted");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    }
  }, [fetchReports]);

  const filteredPlayers = players.filter(
    (p) =>
      p.pseudo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.currentTeam?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
      r.player.pseudo.toLowerCase().includes(reportSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex flex-wrap gap-0 mb-8 bg-card rounded-lg border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 min-w-[120px] p-4">
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-96 mb-6" />
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-card">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <th key={i} className="text-left p-3">
                        <Skeleton className="h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: 7 }).map((_, colIdx) => (
                        <td key={colIdx} className="p-3">
                          <Skeleton className="h-4 w-16" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <PageTitle className="text-text-heading mb-2">Admin Dashboard</PageTitle>
            <p className="text-text-body">Manage players, reports, edit profiles, upload photos</p>
          </div>
          <Link href="/admin/data-completeness">
            <Button variant="outline" size="sm" className="gap-1.5">
              <BarChart3 className="size-4" />
              Data Completeness
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-0 mb-8 bg-card rounded-lg border border-border overflow-hidden">
        {[
          { value: stats.totalPlayers, label: "Total Players" },
          { value: stats.freeAgents, label: "Free Agents" },
          { value: stats.lecPlayers, label: "LEC Players" },
          { value: stats.featuredCount, label: "POTM" },
          { value: stats.reportsCount, label: "Reports" },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            className={`flex-1 min-w-[120px] p-4 flex flex-col gap-1 ${
              i < arr.length - 1 ? "border-r border-border" : ""
            }`}
          >
            <DataValue highlight className="text-text-heading">{stat.value}</DataValue>
            <DataLabel className="normal-case">{stat.label}</DataLabel>
          </div>
        ))}
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="mb-6 overflow-x-auto scrollbar-hide w-full flex-nowrap">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="prospects">
            <TrendingUp className="h-3.5 w-3.5 mr-1" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="soloq-potw">
            <Zap className="h-3.5 w-3.5 mr-1" />
            SoloQ POTW
          </TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="oracle-import">
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            Import
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="h-3.5 w-3.5 mr-1" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                placeholder="Search players..."
                className="pl-10 bg-card border-border text-text-heading"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-border text-text-body hover:bg-surface-hover"
                onClick={() => window.location.href = "/admin/import"}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                className="bg-surface-elevated text-text-heading hover:bg-secondary"
                onClick={startAdd}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {/* Players Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover">
                      <th className="text-left p-3"><DataLabel>Player</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Role</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Team</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>League</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Status</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Links</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>POTM</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Actions</DataLabel></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => (
                      <tr key={player.id} className="border-b border-border hover:bg-surface-hover">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {player.photoUrl ? (
                              <Image
                                src={player.photoUrl}
                                alt={player.pseudo}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-bold text-text-heading">
                                {(player.pseudo?.[0] ?? "?").toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-text-heading">{player.pseudo}</p>
                              {player.realName && (
                                <p className="text-xs text-text-body">{player.realName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{player.role}</Badge>
                        </td>
                        <td className="p-3 text-sm text-text-body">
                          {player.currentTeam || "—"}
                        </td>
                        <td className="p-3 text-sm text-text-body">{player.league}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={STATUS_COLORS[player.status] || "border-border text-text-muted"}
                          >
                            {formatStatus(player.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {player.opggUrl && (
                              <a href={player.opggUrl} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-surface-hover">
                                  op.gg <ExternalLink className="h-3 w-3 ml-1" />
                                </Badge>
                              </a>
                            )}
                            {player.golggUrl && (
                              <a href={player.golggUrl} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-surface-hover">
                                  Gol <ExternalLink className="h-3 w-3 ml-1" />
                                </Badge>
                              </a>
                            )}
                            {player.lolprosUrl && (
                              <a href={player.lolprosUrl} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-surface-hover">
                                  Pros <ExternalLink className="h-3 w-3 ml-1" />
                                </Badge>
                              </a>
                            )}
                            {player.leaguepediaUrl && (
                              <a href={player.leaguepediaUrl} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-surface-hover">
                                  Leaguepedia <ExternalLink className="h-3 w-3 ml-1" />
                                </Badge>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              onClick={() => toggleFeatured(player.id, player.isFeatured)}
                              title="Toggle POTM"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  player.isFeatured ? "text-primary-accent fill-primary-accent" : "text-text-muted"
                                }`}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              onClick={() => syncSoloq(player.id)}
                              title="Sync SoloQ from Riot"
                            >
                              <Zap className="h-4 w-4 text-success" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Dialog
                              open={editingPlayer?.id === player.id}
                              onOpenChange={(open) => {
                                if (!open) setEditingPlayer(null);
                              }}
                            >
                              <DialogTrigger>
                                <div
                                  className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-surface-hover cursor-pointer min-h-[44px] min-w-[44px]"
                                  onClick={() => startEdit(player)}
                                >
                                  <Edit className="h-4 w-4 text-accent" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit {player.pseudo}</DialogTitle>
                                </DialogHeader>
                                <Tabs defaultValue="info" className="w-full">
                                  <TabsList className="mb-4">
                                    <TabsTrigger value="info">
                                      <Users className="h-3.5 w-3.5 mr-1" />
                                      Info
                                    </TabsTrigger>
                                    <TabsTrigger value="prostats">
                                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                                      Pro Stats
                                    </TabsTrigger>
                                    <TabsTrigger value="tags">
                                      <Tag className="h-3.5 w-3.5 mr-1" />
                                      Tags
                                    </TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="info">
                                    <PlayerForm
                                      formData={formData}
                                      setFormData={setFormData}
                                      onSave={savePlayer}
                                      onCancel={() => setEditingPlayer(null)}
                                      playerId={player.id}
                                      onSyncSoloq={syncSoloq}
                                    />
                                  </TabsContent>
                                  <TabsContent value="prostats">
                                    <ProStatsForm playerId={player.id} />
                                  </TabsContent>
                                  <TabsContent value="tags">
                                    <BehaviorTagsForm playerId={player.id} />
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              onClick={() => deletePlayer(player.id)}
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
              {/* Players Pagination */}
              {playersTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-text-body">
                    {playersTotal} players — Page {playersPage} of {playersTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPlayers(playersPage - 1)}
                      disabled={playersPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchPlayers(playersPage + 1)}
                      disabled={playersPage >= playersTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prospects">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading prospects...</div>}>
            <ProspectsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="soloq-potw">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading SoloQ POTW...</div>}>
            <SoloqPotwTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="oracle-import">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading import...</div>}>
            <OracleImportTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="sync">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading sync...</div>}>
            <SyncTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="alerts">
          <Suspense fallback={<div className="py-8 text-center text-text-muted">Loading alerts...</div>}>
            <AlertsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="reports">
          {/* Reports Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-10 bg-card border-border text-text-heading"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-surface-elevated text-text-heading hover:bg-secondary"
              onClick={startAddReport}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </div>

          {/* Reports Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover">
                      <th className="text-left p-3"><DataLabel>Title</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Player</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Author</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Verdict</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Type</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Date</DataLabel></th>
                      <th className="text-left p-3"><DataLabel>Actions</DataLabel></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-border hover:bg-surface-hover">
                        <td className="p-3">
                          <p className="font-medium text-text-heading">{report.title}</p>
                        </td>
                        <td className="p-3 text-sm text-text-body">{report.player.pseudo}</td>
                        <td className="p-3 text-sm text-text-body">{report.author}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={VERDICT_COLORS[report.verdict] || "border-border text-text-muted"}
                          >
                            {report.verdict}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={report.isPremium ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-surface-hover text-text-heading border-border"}
                          >
                            {report.isPremium ? "Premium" : "Free"}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-text-body">
                          {new Date(report.publishedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Dialog
                              open={editingReport?.id === report.id}
                              onOpenChange={(open) => {
                                if (!open) setEditingReport(null);
                              }}
                            >
                              <DialogTrigger>
                                <div
                                  className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-surface-hover cursor-pointer min-h-[44px] min-w-[44px]"
                                  onClick={() => startEditReport(report)}
                                >
                                  <Edit className="h-4 w-4 text-accent" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Report</DialogTitle>
                                </DialogHeader>
                                <ReportForm
                                  players={players}
                                  formData={reportFormData}
                                  setFormData={setReportFormData}
                                  onSave={saveReport}
                                  onCancel={() => setEditingReport(null)}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 min-h-[44px] min-w-[44px]"
                              onClick={() => deleteReport(report.id)}
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
              {/* Reports Pagination */}
              {reportsTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-text-body">
                    {reportsTotal} reports — Page {reportsPage} of {reportsTotalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReports(reportsPage - 1)}
                      disabled={reportsPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReports(reportsPage + 1)}
                      disabled={reportsPage >= reportsTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Player Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <PlayerForm
            formData={formData}
            setFormData={setFormData}
            onSave={savePlayer}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Report Dialog */}
      <Dialog open={isAddReportDialogOpen} onOpenChange={setIsAddReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Report</DialogTitle>
          </DialogHeader>
          <ReportForm
            players={players}
            formData={reportFormData}
            setFormData={setReportFormData}
            onSave={saveReport}
            onCancel={() => setIsAddReportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

// Player Form Component
function PlayerForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  playerId,
  onSyncSoloq,
}: {
  formData: Partial<Player>;
  setFormData: (data: Partial<Player>) => void;
  onSave: () => void;
  onCancel: () => void;
  playerId?: string;
  onSyncSoloq?: (id: string) => void;
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
            placeholder="Adam"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="realName">Real Name</Label>
          <Input
            id="realName"
            value={formData.realName || ""}
            onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
            placeholder="Adam Maanane"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            value={formData.role || "TOP"}
            onValueChange={(v: string | null) => setFormData({ ...formData, role: v || "TOP" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r: string) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input
            id="nationality"
            value={formData.nationality || ""}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="France"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age || ""}
            onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="22"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentTeam">Current Team</Label>
          <Input
            id="currentTeam"
            value={formData.currentTeam || ""}
            onChange={(e) => setFormData({ ...formData, currentTeam: e.target.value })}
            placeholder="G2 Esports"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="league">League *</Label>
          <Select
            value={formData.league || "LEC"}
            onValueChange={(v: string | null) => setFormData({ ...formData, league: v || "LEC" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAGUES.map((l: string) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier">Tier</Label>
          <Select
            value={formData.tier || ""}
            onValueChange={(v: string | null) => setFormData({ ...formData, tier: v || null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tier..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {TIERS.map((t) => (
                <SelectItem key={t} value={t}>{TIER_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status || "UNDER_CONTRACT"}
            onValueChange={(v: string | null) => setFormData({ ...formData, status: v || "UNDER_CONTRACT" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Riot Account</Label>
          {playerId && onSyncSoloq && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-7"
              disabled={!formData.riotId}
              onClick={() => onSyncSoloq(playerId)}
            >
              <Zap className="h-3 w-3" />
              Sync SoloQ
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.riotId || ""}
            onChange={(e) => setFormData({ ...formData, riotId: e.target.value })}
            placeholder="Riot ID (e.g. Yoshua Sidestep#KUBI)"
          />
          <p className="text-xs text-text-body self-center">
            Used to sync SoloQ stats from Riot API
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>External Links</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.opggUrl || ""}
            onChange={(e) => setFormData({ ...formData, opggUrl: e.target.value })}
            placeholder="op.gg URL"
          />
          <Input
            value={formData.golggUrl || ""}
            onChange={(e) => setFormData({ ...formData, golggUrl: e.target.value })}
            placeholder="Gol.gg URL (ex: https://gol.gg/players/player-stats/3489/...)"
          />
          <Input
            value={formData.lolprosUrl || ""}
            onChange={(e) => setFormData({ ...formData, lolprosUrl: e.target.value })}
            placeholder="LoLPros URL"
          />
          <Input
            value={formData.leaguepediaUrl || ""}
            onChange={(e) => setFormData({ ...formData, leaguepediaUrl: e.target.value })}
            placeholder="Leaguepedia URL"
          />
          <Input
            value={formData.twitterUrl || ""}
            onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
            placeholder="Twitter URL"
          />
          <Input
            value={formData.agentTwitterUrl || ""}
            onChange={(e) => setFormData({ ...formData, agentTwitterUrl: e.target.value })}
            placeholder="Agent Twitter URL"
          />
          <Input
            value={formData.twitchUrl || ""}
            onChange={(e) => setFormData({ ...formData, twitchUrl: e.target.value })}
            placeholder="Twitch URL"
          />
          <ImageUpload
            value={formData.photoUrl || ""}
            onChange={(url) => setFormData({ ...formData, photoUrl: url })}
          />
        </div>
      </div>

      {/* Prospect Toggle */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Checkbox
          id="isProspect"
          checked={formData.isProspect || false}
          onCheckedChange={(checked) => setFormData({ ...formData, isProspect: checked === true })}
        />
        <Label htmlFor="isProspect" className="cursor-pointer font-medium text-text-heading">
          Prospect
        </Label>
        <span className="text-xs text-text-muted">
          Mark as prospect to include in prospects page
        </span>
      </div>

      {/* Prospect Scoring Fields */}
      <div className="space-y-2">
        <Label>Prospect Scoring</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="peakElo2Years" className="text-xs text-text-muted">Peak ELO (last 2 years)</Label>
              <span className="text-xs text-text-muted">
                {formData.peakElo2Years ? `→ ${Math.min((formData.peakElo2Years / 1500) * 25, 25).toFixed(1)} / 25 pts` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="peakEloTop100"
                checked={formData.peakElo2Years === 1500}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({ ...formData, peakElo2Years: 1500 });
                  } else {
                    setFormData({ ...formData, peakElo2Years: null });
                  }
                }}
              />
              <Label htmlFor="peakEloTop100" className="text-xs text-text-muted cursor-pointer">
                Top 100 EUW (max 25 pts)
              </Label>
            </div>
            {formData.peakElo2Years !== 1500 && (
              <Select
                value={formData.peakElo2Years?.toString() || ""}
                onValueChange={(v) => setFormData({ ...formData, peakElo2Years: v ? parseInt(v) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LP range..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unknown</SelectItem>
                  <SelectItem value="1350">1200-1500 LP — 20-25 pts</SelectItem>
                  <SelectItem value="1050">900-1199 LP — 15-20 pts</SelectItem>
                  <SelectItem value="750">600-899 LP — 10-15 pts</SelectItem>
                  <SelectItem value="450">300-599 LP — 5-10 pts</SelectItem>
                  <SelectItem value="150">0-299 LP — 0-5 pts</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bestProResult" className="text-xs text-text-muted">Best Pro Result</Label>
              {(() => {
                const tier3 = ["LFL", "LES", "TCL", "PRM", "NACL", "LDL", "LCK CL"];
                const isT3 = tier3.includes(formData.league || "");
                const opt = [
                  { value: "Champion", label: "Champion / Winner", t3: 25, t4: 12.5 },
                  { value: "Final", label: "Final", t3: 20, t4: 10 },
                  { value: "Semi", label: "Semi / 3-4", t3: 16.25, t4: 6.25 },
                  { value: "Quarter", label: "Quarter / 5-8", t3: 12.5, t4: 2.5 },
                ].find((o) => o.value === formData.bestProResult);
                if (!opt) return null;
                return (
                  <span className="text-xs text-primary-accent font-medium">
                    → {isT3 ? opt.t3 : opt.t4} pts
                  </span>
                );
              })()}
            </div>
            <Select
              value={formData.bestProResult || ""}
              onValueChange={(v) => setFormData({ ...formData, bestProResult: v || null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No result — 2.5 pts</SelectItem>
                <SelectItem value="Champion">Champion / Winner — 25 pts (T3) / 12.5 pts (T4)</SelectItem>
                <SelectItem value="Final">Final — 20 pts (T3) / 10 pts (T4)</SelectItem>
                <SelectItem value="Semi">Semi / 3-4 — 16.25 pts (T3) / 6.25 pts (T4)</SelectItem>
                <SelectItem value="Quarter">Quarter / 5-8 — 12.5 pts (T3) / 2.5 pts (T4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="eyeTestRating" className="text-xs text-text-muted">Eye Test (0-5)</Label>
            <Input
              id="eyeTestRating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={formData.eyeTestRating || ""}
              onChange={(e) => setFormData({ ...formData, eyeTestRating: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="0 to 5"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox
              id="hasPlayedInMajorLeague"
              checked={formData.hasPlayedInMajorLeague || false}
              onCheckedChange={(checked) => setFormData({ ...formData, hasPlayedInMajorLeague: checked === true })}
            />
            <Label htmlFor="hasPlayedInMajorLeague" className="text-xs text-text-muted cursor-pointer">
              Has played in T1/T2 major league (excludes from prospects)
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio || ""}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Player description..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractEndDate">Contract End Date</Label>
          <Input
            id="contractEndDate"
            type="date"
            value={formData.contractEndDate || ""}
            onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
          />
          <p className="text-xs text-text-body">
            Used for contract expiry alerts
          </p>
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

function AlertsTab() {
  const [checking, setChecking] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  useEffect(() => {
    fetch("/api/admin/contract-expiry")
      .then((r) => r.json())
      .then((data) => {
        setExpiringContracts(data.players || []);
        setLoadingContracts(false);
      })
      .catch(() => setLoadingContracts(false));
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/cron/check-alerts", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setLastResult(data);
        toast.success(`Created ${data.alertsCreated} alerts`);
      } else {
        toast.error(data.error || "Alert check failed");
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contract Expiry Widget */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-accent" />
            Contract Expiry Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingContracts ? (
            <div className="py-4 text-center text-text-muted">Loading...</div>
          ) : expiringContracts.length === 0 ? (
            <p className="text-sm text-text-muted">No contracts expiring in the next 90 days.</p>
          ) : (
            <div className="space-y-2">
              {expiringContracts.map((player: any) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-surface-hover rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-sm font-bold text-text-heading">
                      {player.pseudo[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-heading">{player.pseudo}</p>
                      <p className="text-xs text-text-muted">{player.role} • {player.league} • {player.currentTeam || "No team"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={player.daysUntil <= 30 ? "bg-red-500/20 text-red-400 border-red-500/30" : player.daysUntil <= 60 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                      {player.daysUntil} days
                    </Badge>
                    <p className="text-xs text-text-muted mt-1">{new Date(player.contractEndDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-accent" />
            Smart Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-body">
            Checks all watchlisted players for significant changes and creates notifications:
          </p>
          <ul className="text-sm text-text-body space-y-1 list-disc list-inside">
            <li>Rank milestones (Challenger, Grandmaster)</li>
            <li>High LP gains (500+ LP)</li>
            <li>Free agent status changes</li>
            <li>Contract expiry (30, 60, 90 days)</li>
            <li>New scouting reports published</li>
          </ul>
          <Button
            onClick={handleCheck}
            disabled={checking}
            className="bg-surface-elevated text-text-heading hover:bg-secondary"
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {checking ? "Checking..." : "Run Alert Check"}
          </Button>
        </CardContent>
      </Card>

      {lastResult?.alertsCreated !== undefined && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Last Check Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4 bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 text-green-400">
                {lastResult.alertsCreated}
              </div>
              <div className="text-sm text-green-700 text-green-400">
                alerts created
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SyncTab() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/cron/sync-stats", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setLastResult(data);
        toast.success(`Synced ${data.summary.success}/${data.summary.total} players`);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Sync request failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary-accent" />
            Sync All Player Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-body">
            This will fetch the latest SoloQ stats (rank, LP, winrate, recent matches)
            for all players that have a Riot PUUID configured.
          </p>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="bg-surface-elevated text-text-heading hover:bg-secondary"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {syncing ? "Syncing..." : "Start Sync"}
          </Button>
        </CardContent>
      </Card>

      {lastResult?.summary && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Last Sync Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-surface-hover rounded-lg">
                <div className="text-2xl font-bold text-text-heading">
                  {lastResult.summary.total}
                </div>
                <div className="text-xs text-text-body">Total Players</div>
              </div>
              <div className="text-center p-4 bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 text-green-400">
                  {lastResult.summary.success}
                </div>
                <div className="text-xs text-green-700 text-green-400">Success</div>
              </div>
              <div className="text-center p-4 bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 text-red-400">
                  {lastResult.summary.failed}
                </div>
                <div className="text-xs text-red-700 text-red-400">Failed</div>
              </div>
              <div className="text-center p-4 bg-surface-hover rounded-lg">
                <div className="text-2xl font-bold text-text-heading">
                  {lastResult.results?.filter((r: any) => r.error?.includes("No riotPuuid")).length || 0}
                </div>
                <div className="text-xs text-text-body">Missing PUUID</div>
              </div>
            </div>
            {lastResult.summary.startedAt && (
              <p className="text-xs text-text-body mt-4 text-center">
                Started: {new Date(lastResult.summary.startedAt).toLocaleString()} ·
                Completed: {new Date(lastResult.summary.completedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {lastResult?.results && lastResult.results.some((r: any) => !r.success) && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 text-red-400">Failed Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              {lastResult.results
                .filter((r: any) => !r.success)
                .map((r: any) => (
                  <div key={r.playerId} className="py-2 flex items-center justify-between">
                    <span className="font-medium text-sm">{r.pseudo}</span>
                    <span className="text-xs text-red-600 text-red-400">{r.error}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


