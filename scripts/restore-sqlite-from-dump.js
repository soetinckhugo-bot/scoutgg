/**
 * Restore local SQLite (prisma/dev.db) from prisma/dump-for-turso.sql.
 * Usage: node scripts/restore-sqlite-from-dump.js
 */

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DUMP_PATH = path.join(__dirname, "..", "prisma", "dump-for-turso.sql");
const DB_PATH = path.join(__dirname, "..", "prisma", "dev.db");

function parseStatements(sql) {
  const statements = [];
  let buffer = "";
  let inString = false;

  for (const rawLine of sql.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("--") || line === "") continue;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      buffer += char;

      if (char === "'") {
        if (i + 1 < line.length && line[i + 1] === "'") {
          buffer += "'";
          i++;
        } else {
          inString = !inString;
        }
      }
    }

    if (!inString && buffer.trim().endsWith(";")) {
      statements.push(buffer.trim());
      buffer = "";
    } else {
      buffer += "\n";
    }
  }

  return statements;
}

async function main() {
  console.log("📦 Reading dump...");
  const dump = fs.readFileSync(DUMP_PATH, "utf-8");
  const statements = parseStatements(dump);
  const insertStmts = statements.filter((s) => s.toUpperCase().startsWith("INSERT"));

  console.log(`🗑️  Removing existing ${DB_PATH}`);
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  console.log("🏗️  Creating schema with Prisma...");
  // Use child_process to run prisma db push non-interactively
  const { execSync } = require("child_process");
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });

  console.log(`📥 Inserting ${insertStmts.length} rows...`);
  const db = new Database(DB_PATH);
  db.exec("PRAGMA foreign_keys = OFF");

  const BATCH_SIZE = 100;
  for (let i = 0; i < insertStmts.length; i += BATCH_SIZE) {
    const batch = insertStmts.slice(i, i + BATCH_SIZE);
    const transaction = db.transaction(() => {
      for (const sql of batch) {
        try {
          db.exec(sql);
        } catch (err) {
          if (!err.message.includes("UNIQUE constraint failed")) {
            console.error(`\n⚠️  Insert failed: ${err.message}`);
            console.error(`   ${sql.slice(0, 120)}...`);
          }
        }
      }
    });
    transaction();
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, insertStmts.length)}/${insertStmts.length}`);
  }
  console.log("");

  db.exec("PRAGMA foreign_keys = ON");
  db.close();

  console.log("✅ Restore complete.");
  console.log("\nNext steps:");
  console.log("  1. Run: npx prisma generate");
  console.log("  2. Verify with: node scripts/check-player-count.js");
  console.log("  3. Commit prisma/dev.db and deploy to Vercel.");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
