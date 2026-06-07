import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Ensure DATABASE_URL points to the absolute path of the SQLite DB
  // so it works during Vercel build-time prerendering regardless of CWD
  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;

  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
