import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";

/**
 * POST /api/admin/cron/:job
 * Secure proxy for cron jobs — requires admin auth.
 * Prevents exposing CRON_SECRET to the client.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { job } = await params;
  const allowedJobs = ["sync-stats", "check-alerts", "weekly-digest", "import-oracle"];

  if (!allowedJobs.includes(job)) {
    return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/${job}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({ success: res.ok }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Cron proxy error for ${job}:`, error);
    return NextResponse.json(
      { error: "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}
