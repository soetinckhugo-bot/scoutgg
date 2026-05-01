import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/server/db";
import { RegisterSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/server/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  // Rate limit: 5 registrations per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(`register:${ip}`, 5, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "user",
        isPremium: false,
        subscriptionStatus: "inactive",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error:", { error });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
