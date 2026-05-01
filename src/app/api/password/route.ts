import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/logger";

const PasswordSchema = z.object({
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  // Rate limit: 3 attempts per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`password:${ip}`, 3, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = PasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }
    const { password } = parsed.data;
    const expected = process.env.SITE_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "Password not configured" },
        { status: 500 }
      );
    }

    if (password === expected) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("site_access", expected, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        path: "/",
      });
      return response;
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    logger.error("Password check error:", { error });
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
