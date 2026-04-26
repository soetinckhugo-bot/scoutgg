import { db } from "@/lib/server/db";
import Link from "next/link";
import { Lock, Star, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Metadata } from "next";
import ReportCard from "@/components/ReportCard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

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
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPremium = user?.isPremium === true && user?.subscriptionStatus === "active";

  const reports = await getReports();

  const freeReports = reports.filter((r) => !r.isPremium);
  const premiumReports = reports.filter((r) => r.isPremium);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A2E] dark:text-white mb-2">Scouting Reports</h1>
        <p className="text-[#6C757D] dark:text-gray-400">
          In-depth analysis and scouting reports by our expert team
        </p>
      </div>

      {/* Free Reports */}
      {freeReports.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-[#1A1A2E] dark:text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-[#28A745]" />
            Free Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeReports.map((report) => (
              <Link key={report.id} href={`/players/${report.playerId}`}>
                <ReportCard report={report} variant="free" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Premium Reports */}
      {premiumReports.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A2E] dark:text-white mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#E94560]" />
            Premium Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiumReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                variant={isPremium ? "premium" : "preview"}
              />
            ))}
          </div>
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
  );
}

