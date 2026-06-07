"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Loader2 } from "lucide-react";
import { ROLE_COLORS } from "@/lib/constants";

interface RecentComment {
  id: string;
  playerId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  player: {
    id: string;
    pseudo: string;
    photoUrl: string | null;
    role: string;
  };
}

export default function RecentDiscussions() {
  const [comments, setComments] = useState<RecentComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecent();
  }, []);

  async function fetchRecent() {
    try {
      const res = await fetch("/api/comments/recent");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // Silently fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageSquare className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-xs text-text-body">No staff discussions yet</p>
        <p className="text-xs text-text-muted mt-0.5">
          Comments on player profiles will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {comments.map((comment) => (
        <Link
          key={comment.id}
          href={`/players/${comment.playerId}`}
          className="block px-4 py-3 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-start gap-2.5">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="bg-primary-accent/20 text-primary-accent text-[10px]">
                {(comment.user.name?.[0] || comment.user.email[0] || "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-text-heading">
                  {comment.user.name || comment.user.email}
                </span>
                <span className="text-[10px] text-text-muted">on</span>
                <span className="text-xs font-medium text-primary-accent truncate">
                  {comment.player.pseudo}
                </span>
                {comment.player.role && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-3.5 px-0.5 ${ROLE_COLORS[comment.player.role] || ""}`}
                  >
                    {comment.player.role}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-body line-clamp-2">{comment.content}</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {new Date(comment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
