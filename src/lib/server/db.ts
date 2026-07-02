import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Default local SQLite path when no DATABASE_URL is provided
    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    databaseUrl = `file:${dbPath}`;
  } else if (databaseUrl.startsWith("file:")) {
    // Resolve relative SQLite paths to an absolute path so Prisma can open
    // the DB regardless of the current working directory (build, tests, etc.)
    const dbPath = databaseUrl.slice("file:".length);
    if (!path.isAbsolute(dbPath)) {
      databaseUrl = `file:${path.resolve(process.cwd(), dbPath)}`;
    }
  }

  process.env.DATABASE_URL = databaseUrl;
  return new PrismaClient();
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
