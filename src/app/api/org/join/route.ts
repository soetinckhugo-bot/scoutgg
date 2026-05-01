import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { db } from "@/lib/server/db";
import { authOptions } from "@/lib/server/auth-options";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    const invite = await db.orgInvite.findUnique({
      where: { token },
      include: { org: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: "Invite already used" }, { status: 410 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // If logged in, auto-join
    if (userEmail) {
      if (userEmail !== invite.email) {
        return NextResponse.json(
          { error: "This invite is for a different email" },
          { status: 403 }
        );
      }

      await db.user.update({
        where: { email: userEmail },
        data: { orgId: invite.orgId },
      });

      await db.orgInvite.update({
        where: { id: invite.id },
        data: { used: true },
      });

      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/org`);
    }

    // Not logged in — redirect to login with return URL
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?callbackUrl=/api/org/join?token=${token}`
    );
  } catch (error) {
    logger.error("Join error:", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

