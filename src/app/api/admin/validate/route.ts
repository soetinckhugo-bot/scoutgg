/**
 * API de validation post-import
 * Vérifie la cohérence des données importées
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { validateImport } from "@/lib/import-validator";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get("league");

    if (!league) {
      return NextResponse.json(
        { error: "League parameter required" },
        { status: 400 }
      );
    }

    const result = await validateImport(league);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}
