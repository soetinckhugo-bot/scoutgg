import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ROLE_COLORS, STATUS_COLORS } from "@/lib/constants";
import { formatStatus } from "@/lib/utils";
import Avatar from "@/components/Avatar";
import Flag from "@/components/Flag";
import { CalendarClock, Building2 } from "lucide-react";

interface MercatoCardProps {
  player: {
    id: string;
    pseudo: string;
    realName: string | null;
    role: string;
    league: string;
    status: string;
    currentTeam: string | null;
    photoUrl: string | null;
    nationality: string | null;
    contractEndDate: Date | null;
  };
}

function getExpiryBadge(date: Date | null, status: string) {
  if (status === "FREE_AGENT") {
    return (
      <Badge className="text-xs bg-red-500/10 text-red-400 border border-red-500/20">
        Free Agent
      </Badge>
    );
  }

  if (!date) {
    return (
      <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
        Under Contract
      </Badge>
    );
  }

  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <Badge className="text-xs bg-red-500/10 text-red-400 border border-red-500/20">
        Expired
      </Badge>
    );
  }

  if (days <= 30) {
    return (
      <Badge className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">
        {days}d left
      </Badge>
    );
  }

  if (days <= 90) {
    return (
      <Badge className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        {days}d left
      </Badge>
    );
  }

  return (
    <Badge className="text-xs bg-green-500/10 text-green-400 border border-green-500/20">
      {days}d left
    </Badge>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MercatoCard({ player }: MercatoCardProps) {
  return (
    <Link href={`/players/${player.id}`} className="block h-full">
      <div className="rounded-xl border border-border bg-card hover:border-primary-accent/50 hover:bg-surface-hover transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer p-4 group h-full flex flex-col">
        <div className="flex items-start gap-3">
          <Avatar
            src={player.photoUrl}
            alt={player.pseudo}
            fallback={player.pseudo}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-text-heading truncate text-sm group-hover:text-primary-accent transition-colors">
                {player.pseudo}
              </h3>
              <Badge className={`text-xs h-4 px-1 ${ROLE_COLORS[player.role] || ""}`}>
                {player.role}
              </Badge>
            </div>
            {player.realName && (
              <p className="text-xs text-text-muted truncate">{player.realName}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {player.nationality && <Flag code={player.nationality} />}
              <span className="text-xs text-text-muted">{player.league}</span>
            </div>
          </div>
        </div>

        {/* Contract status */}
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs text-text-body truncate">
                {player.currentTeam || "No team"}
              </span>
            </div>
            {getExpiryBadge(player.contractEndDate, player.status)}
          </div>

          {player.contractEndDate && player.status === "UNDER_CONTRACT" && (
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">
                Until {formatDate(player.contractEndDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
