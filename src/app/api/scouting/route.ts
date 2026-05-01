import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth-options";

const COLUMNS = [
  { key: "discovery", label: "Discovery", color: "#6C757D" },
  { key: "evaluation", label: "Evaluation", color: "#0F3460" },
  { key: "shortlist", label: "Shortlist", color: "#E94560" },
  { key: "contacted", label: "Contacted", color: "#FFC107" },
  { key: "signed", label: "Signed", color: "#1E7E34" },
  { key: "rejected", label: "Rejected", color: "#6C757D" },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const cards = await db.scoutingCard.findMany({
    where: { userId: user.id },
    take: 100,
    include: {
      player: {
        select: {
          id: true,
          pseudo: true,
          role: true,
          league: true,
          status: true,
          currentTeam: true,
          photoUrl: true,
          tier: true,
          proStats: {
            select: {
              globalScore: true,
              tierScore: true,
              winRate: true,
              gamesPlayed: true,
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ columns: COLUMNS, cards });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { playerId, status = "discovery", notes, priority, tags } = await request.json();

  if (!playerId) {
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  }

  const existing = await db.scoutingCard.findFirst({
    where: { userId: user.id, playerId },
  });

  if (existing) {
    return NextResponse.json({ error: "Player already in board" }, { status: 409 });
  }

  const maxOrder = await db.scoutingCard.aggregate({
    where: { userId: user.id, status },
    _max: { order: true },
  });

  const card = await db.scoutingCard.create({
    data: {
      userId: user.id,
      playerId,
      status,
      notes: notes || null,
      priority: priority || null,
      tags: tags || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
