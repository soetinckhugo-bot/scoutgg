"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Plus,
  Loader2,
  Mail,
  Trash2,
  Crown,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface OrgMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
}

interface OrgInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxSeats: number;
  users: OrgMember[];
  invites: OrgInvite[];
}

export default function OrgPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchOrg();
    }
  }, [status, router]);

  async function fetchOrg() {
    try {
      const res = await fetch("/api/org");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrg(data.org);
    } catch {
      toast.error("Failed to load organization");
    } finally {
      setLoading(false);
    }
  }

  async function createOrg() {
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      await fetchOrg();
      setNewOrgName("");
      toast.success("Organization created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function inviteMember() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await fetchOrg();
      setInviteEmail("");
      toast.success("Invite sent");
      if (data.joinUrl) {
        navigator.clipboard.writeText(data.joinUrl);
        toast.info("Join link copied to clipboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", memberId }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchOrg();
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove");
    }
  }

  const isAdmin = org?.users?.find(
    (u) => u.email === session?.user?.email
  )?.role === "org_admin";

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-[#E94560]" />
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 text-[#E9ECEF] dark:text-gray-700 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-2">
            Organization
          </h1>
          <p className="text-[#6C757D] dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create an organization to share watchlists, collaborate on scouting,
            and manage team access.
          </p>
          <Card className="max-w-md mx-auto border-[#E9ECEF] dark:border-gray-700">
            <CardContent className="p-6 space-y-4">
              <Input
                placeholder="Organization name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
              />
              <Button
                onClick={createOrg}
                disabled={creating || !newOrgName.trim()}
                className="w-full bg-[#1A1A2E] text-white hover:bg-[#16213E]"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-7 w-7 text-[#E94560]" />
          <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white">
            {org.name}
          </h1>
          <Badge
            variant="secondary"
            className="bg-[#F8F9FA] dark:bg-[#1e293b] text-[#6C757D] dark:text-gray-400"
          >
            {org.plan}
          </Badge>
        </div>
        <p className="text-[#6C757D] dark:text-gray-400">
          {org.slug} · {org.users.length}/{org.maxSeats} seats
        </p>
      </div>

      <div className="space-y-6">
        {/* Members */}
        <Card className="border-[#E9ECEF] dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0F3460]" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#E9ECEF] dark:divide-gray-700">
              {org.users.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[#1A1A2E] dark:text-white">
                        {member.name || member.email}
                      </span>
                      {member.role === "org_admin" && (
                        <Badge className="text-xs h-4 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                          <Crown className="h-2 w-2 mr-0.5" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[#6C757D] dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                  {isAdmin && member.email !== session?.user?.email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Invite */}
        {isAdmin && org.users.length < org.maxSeats && (
          <Card className="border-[#E9ECEF] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#0F3460]" />
                Invite Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="colleague@team.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                />
                <Button
                  onClick={inviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-[#1A1A2E] text-white hover:bg-[#16213E] shrink-0"
                >
                  {inviting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#6C757D] dark:text-gray-400">
                They will receive an invite link to join your organization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {isAdmin && org.invites.length > 0 && (
          <Card className="border-[#E9ECEF] dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Pending Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[#E9ECEF] dark:divide-gray-700">
                {org.invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-[#1A1A2E] dark:text-white">
                      {invite.email}
                    </span>
                    <span className="text-xs text-[#6C757D] dark:text-gray-400">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

