import NextAuth from "next-auth";
import { authOptions } from "@/lib/server/auth-options";

function createHandler(remember: boolean) {
  const options = {
    ...authOptions,
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: remember ? 30 * 24 * 60 * 60 : undefined,
        },
      },
    },
  };

  return NextAuth(options);
}

export async function POST(req: Request) {
  let remember = false;
  let bodyText = "";

  try {
    bodyText = await req.text();
    const body = JSON.parse(bodyText);
    remember = body.remember === true || body.remember === "true";
  } catch {
    // Body non-JSON ou vide
  }

  // Recréer une requête fraîche pour NextAuth avec le même body
  const newReq = new Request(req.url, {
    method: req.method,
    headers: req.headers,
    body: bodyText || undefined,
  });

  const handler = createHandler(remember);
  return handler(newReq);
}

const defaultHandler = createHandler(false);
export { defaultHandler as GET };
