import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/server/db";
import { ReportCreateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

const DEFAULT_LIMIT = 50;

export async function GET(request: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`reports-get:${ip}`, 60, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)));
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const isPremium = user?.isPremium === true && user?.subscriptionStatus === "active";

    const [reports, totalCount] = await Promise.all([
      db.report.findMany({
        orderBy: { publishedAt: "desc" },
        include: {
          player: {
            select: { pseudo: true },
          },
        },
        skip,
        take: limit,
      }),
      db.report.count(),
    ]);

    // If not premium, redact premium report content
    const sanitizedReports = reports.map((report) => {
      if (report.isPremium && !isPremium) {
        return {
          ...report,
          content: "",
          strengths: "",
          weaknesses: "",
          verdict: "",
          author: "",
          _locked: true as const,
        };
      }
      return { ...report, _locked: false as const };
    });

    return NextResponse.json({
      reports: sanitizedReports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      meta: {
        isPremium,
      },
    });
  } catch (error) {
    logger.error("Error fetching reports", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const json = await request.json();
    const parsed = ReportCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;

    const report = await db.report.create({
      data: {
        playerId: body.playerId,
        title: body.title,
        content: body.content ?? "",
        strengths: body.strengths ?? "",
        weaknesses: body.weaknesses ?? "",
        verdict: body.verdict,
        author: body.author,
        isPremium: body.isPremium ?? true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    logger.error("Error creating report", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}

