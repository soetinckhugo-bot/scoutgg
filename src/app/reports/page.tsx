import { db } from "@/lib/server/db";
import Link from "next/link";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";
import ReportCard from "@/components/ReportCard";

export const metadata: Metadata = {
  title: "Reports",
  description: "Professional scouting reports on League of Legends players. In-depth analysis, strengths, weaknesses, and verdicts from expert scouts.",
  openGraph: {
    title: "Scouting Reports | LeagueScout",
    description: "Professional scouting reports on League of Legends players.",
    type: "website",
  },
};

async function getReports() {
  return db.report.findMany({
    orderBy: { publishedAt: "desc" },
    include: {
      player: true,
    },
  });
}

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <div className="min-h-screen bg-background">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-heading mb-2">Scouting Reports</h1>
        <p className="text-text-body">
          In-depth analysis and scouting reports by our expert team
        </p>
      </div>

      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Link key={report.id} href={`/players/${report.playerId}`}>
              <ReportCard report={report} variant="free" />
            </Link>
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Scouting reports will appear here as they're published."
          action={{ label: "Browse players", href: "/players" }}
        />
      )}
    </div>
    </div>
  );
}

