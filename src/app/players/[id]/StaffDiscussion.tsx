"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Comment {
  id: string;
  playerId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function StaffDiscussion({ playerId }: { playerId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/players/${playerId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (!session?.user) {
      toast.error("You must be signed in");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/players/${playerId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) throw new Error("Failed to post");
      const newComment = await res.json();
      setComments((prev) => [
        {
          ...newComment,
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email || "",
            image: session.user.image,
          },
        },
        ...prev,
      ]);
      setContent("");
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment form */}
      {session?.user ? (
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="Add a comment for the staff..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="bg-card border-border resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  size="sm"
                  className="bg-primary-accent hover:bg-primary-accent/90"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-surface-hover">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-8 h-8 mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-body mb-2">
              Sign in to join the staff discussion
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-10 h-10 mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-body">No staff comments yet</p>
          <p className="text-xs text-text-muted mt-1">
            Be the first to share your thoughts with the team
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card
              key={comment.id}
              className="border-border bg-surface-hover"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary-accent/20 text-primary-accent text-xs">
                      {(comment.user.name?.[0] || comment.user.email[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-heading">
                        {comment.user.name || comment.user.email}
                      </span>
                      <span className="text-xs text-text-muted">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-body whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
