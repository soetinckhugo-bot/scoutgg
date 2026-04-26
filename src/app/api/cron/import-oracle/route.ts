import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/cron/import-oracle
 * Triggers Oracle Elixir CSV import.
 * In production, this would fetch the CSV from Oracle's API or S3.
 * For now, it's a placeholder that returns instructions.
 * Secured by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: "Oracle import cron placeholder",
    instructions: [
      "To fully automate Oracle imports:",
      "1. Set up an S3 bucket or file storage with the latest CSV",
      "2. Modify this endpoint to fetch the CSV from that source",
      "3. Parse and forward to the import logic",
      "4. Or use Vercel Cron Jobs to trigger this endpoint daily",
    ],
    manualImportUrl: "/admin?tab=oracle-import",
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Use POST with Bearer CRON_SECRET to trigger import",
    note: "This is a placeholder. Implement CSV fetching from your source.",
  });
}

