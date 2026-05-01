"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, AlertCircle, FileText, TrendingUp, Briefcase } from "lucide-react";
import ScoutIcon from "./ScoutIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently fail
    }
  }

  async function markAsRead(id?: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
      if (id) setOpen(false);
    } catch {
      // silently fail
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case "status_change":
        return <ScoutIcon icon={AlertCircle} size="md" variant="info" aria-hidden="true" />;
      case "new_report":
        return <ScoutIcon icon={FileText} size="md" variant="purple" aria-hidden="true" />;
      case "rank_up":
        return <ScoutIcon icon={TrendingUp} size="md" variant="success" aria-hidden="true" />;
      case "transfer":
        return <ScoutIcon icon={Briefcase} size="md" variant="warning" aria-hidden="true" />;
      default:
        return <ScoutIcon icon={Bell} size="md" variant="default" aria-hidden="true" />;
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <ScoutIcon icon={Bell} size="lg" variant="default" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary-accent text-text-heading text-xs font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-lg border border-border shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm text-text-heading">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs text-accent hover:text-text-heading text-text-body hover:text-text-heading flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <ScoutIcon icon={Bell} size="xl" variant="muted" />
                  <p className="text-sm text-text-body">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-border hover:bg-surface-hover cursor-pointer transition-colors ${
                      !notif.read ? "bg-blue-50/50 bg-blue-500/10" : ""
                    }`}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                      if (notif.link) {
                        window.location.href = notif.link;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-heading">
                          {notif.title}
                        </p>
                        <p className="text-xs text-text-body mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-text-muted text-text-muted mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary-accent mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

