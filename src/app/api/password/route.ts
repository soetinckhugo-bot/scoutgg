import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
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
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        path: "/",
      });
      return response;
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
