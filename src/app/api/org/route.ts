import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import { z } from "zod";
import crypto from "crypto";
import { logger } from "@/lib/logger";

function getUserId(session: any): string | null {
  return session?.user?.email || null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  plan: z.enum(["free", "team", "enterprise"]).default("team"),
});

const patchOrgSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z.string().email(),
    role: z.enum(["admin", "member"]).default("member"),
  }),
  z.object({
    action: z.literal("remove"),
    memberId: z.string().min(1),
  }),
]);

// GET - Get current user's org
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: userId },
      include: { org: true },
    });

    if (!user?.orgId) {
      return NextResponse.json({ org: null });
    }

    const org = await db.organization.findUnique({
      where: { id: user.orgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
        invites: {
          where: { used: false },
        },
      },
    });

    return NextResponse.json({ org });
  } catch (error) {
    logger.error("Org fetch error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - Create org
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = createOrgSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, plan } = parsed.data;

    const user = await db.user.findUnique({ where: { email: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.orgId) {
      return NextResponse.json(
        { error: "Already in an organization" },
        { status: 409 }
      );
    }

    const slug = generateSlug(name);
    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Organization slug already taken" },
        { status: 409 }
      );
    }

    const org = await db.organization.create({
      data: {
        name: name.slice(0, 100),
        slug,
        plan,
        maxSeats: plan === "enterprise" ? 20 : 5,
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { orgId: org.id, role: "org_admin" },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    logger.error("Org create error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST invite
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: userId },
      include: { org: true },
    });

    if (!user?.orgId || user.role !== "org_admin") {
      return NextResponse.json({ error: "Not an org admin" }, { status: 403 });
    }

    const json = await request.json();
    const parsed = patchOrgSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === "invite") {
      const { email, role } = data;

      const memberCount = await db.user.count({ where: { orgId: user.orgId } });
      if (memberCount >= (user.org?.maxSeats || 5)) {
        return NextResponse.json({ error: "Seat limit reached" }, { status: 403 });
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await db.orgInvite.create({
        data: {
          orgId: user.orgId,
          email,
          role,
          token,
          expiresAt,
        },
      });

      return NextResponse.json({
        invite,
        joinUrl: `${process.env.NEXTAUTH_URL}/api/org/join?token=${token}`,
      });
    }

    if (data.action === "remove") {
      const { memberId } = data;
      await db.user.update({
        where: { id: memberId },
        data: { orgId: null },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.error("Org patch error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

