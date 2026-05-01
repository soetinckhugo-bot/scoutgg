"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Copy,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  tier: string;
  rateLimit: number;
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState("scout_pro");
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchKeys();
    }
  }, [status, router]);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          tier: newKeyTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create key");
        return;
      }
      setNewKeyRaw(data.key.rawKey);
      setNewKeyName("");
      fetchKeys();
      toast.success("API key created!");
    } catch {
      toast.error("Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      setKeys(keys.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke key");
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary-accent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-heading mb-1">
          Settings
        </h1>
        <p className="text-text-body mb-8">
          Manage your API keys and account preferences
        </p>

        <Card className="border-border mb-6 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary-accent" />
              <CardTitle className="text-text-heading">API Keys</CardTitle>
            </div>
            <CardDescription className="text-text-muted">
              Create and manage API keys for programmatic access. Max 5 active keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-surface-hover rounded-lg">
              <Input
                placeholder="Key name (e.g., Production, Dev)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Select value={newKeyTier} onValueChange={(v) => setNewKeyTier(v || "scout_pro")}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scout_pro">Scout Pro (100/hr)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1000/hr)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={createKey}
                disabled={creating || !newKeyName.trim()}
                className="bg-surface-elevated text-text-heading hover:bg-secondary"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-1" />
                    Create Key
                  </>
                )}
              </Button>
            </div>

            {newKeyRaw && (
              <div className="mb-6 p-4 bg-amber-900/20 border border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-200">
                    Copy this key now — it will not be shown again
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono break-all">
                    {newKeyRaw}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyKey(newKeyRaw)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {keys.length === 0 ? (
              <div className="text-center py-8 text-text-body">
                <Key className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No API keys yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-heading">
                          {key.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 ${
                            key.tier === "enterprise"
                              ? "bg-purple-900/30 text-purple-300"
                              : "bg-blue-900/30 text-blue-300"
                          }`}
                        >
                          {key.tier}
                        </Badge>
                        {!key.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-xs h-4 bg-surface-hover text-text-muted"
                          >
                            Revoked
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-body">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {key.rateLimit}/hr
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {key.lastUsed
                            ? `Used ${new Date(key.lastUsed).toLocaleDateString()}`
                            : "Never used"}
                        </span>
                        {key.expiresAt && (
                          <span>
                            Expires {new Date(key.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {key.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeKey(key.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-text-heading">API Documentation</CardTitle>
            <CardDescription className="text-text-muted">
              Use your API key to access LeagueScout data programmatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-text-heading">Authentication</h4>
              <p className="text-sm text-text-body mb-2">
                Include your API key in the X-API-Key header.
              </p>
              <pre className="bg-surface-elevated text-text-heading p-3 rounded-lg text-xs overflow-x-auto">
{`curl -H "X-API-Key: your_api_key_here" \\
  https://yourdomain.com/api/v1/players`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 text-text-heading">Endpoints</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-900/30 text-green-300 text-xs">GET</Badge>
                  <code className="text-xs text-text-heading">/api/v1/players</code>
                  <span className="text-text-body">List players (paginated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-900/30 text-green-300 text-xs">GET</Badge>
                  <code className="text-xs text-text-heading">/api/v1/players/id</code>
                  <span className="text-text-body">Player details</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2 text-text-heading">Query Parameters</h4>
              <div className="text-sm text-text-body space-y-1">
                <p><code className="text-xs text-text-heading">page</code> — Page number (default: 1)</p>
                <p><code className="text-xs text-text-heading">limit</code> — Items per page, max 100 (default: 50)</p>
                <p><code className="text-xs text-text-heading">role</code> — Filter by role</p>
                <p><code className="text-xs text-text-heading">league</code> — Filter by league</p>
                <p><code className="text-xs text-text-heading">search</code> — Search by player name</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
