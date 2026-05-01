/**
 * Importe un dump SQL SQLite dans Turso / libSQL.
 * Usage: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/import-dump-to-turso.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

const DUMP_PATH = path.join(__dirname, "..", "prisma", "dump-for-turso.sql");

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Définis TURSO_DATABASE_URL et TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });

const dump = fs.readFileSync(DUMP_PATH, "utf-8");
const lines = dump.split("\n");

let buffer = "";
let inString = false;
const schemaStmts = [];
const insertStmts = [];

for (const rawLine of lines) {
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
    const stmt = buffer.trim();
    if (stmt.toUpperCase().startsWith("INSERT")) {
      insertStmts.push(stmt);
    } else {
      schemaStmts.push(stmt);
    }
    buffer = "";
  } else {
    buffer += "\n";
  }
}

async function run() {
  console.log(`📦 ${schemaStmts.length} requêtes schema, ${insertStmts.length} inserts`);

  // Désactiver les foreign keys pendant l'import
  try {
    await client.execute("PRAGMA foreign_keys = OFF");
    console.log("🔓 Foreign keys désactivées");
  } catch (e) {
    console.log("⚠️  Impossible de désactiver FK:", e.message);
  }

  // 1. Schema
  for (let i = 0; i < schemaStmts.length; i++) {
    const stmt = schemaStmts[i];
    try {
      await client.execute(stmt);
      process.stdout.write(`\r  Schema ${i + 1}/${schemaStmts.length}`);
    } catch (err) {
      // Ignore "table already exists" et indexes déjà existants
      if (!err.message.includes("already exists")) {
        console.error(`\n⚠️  Schema error: ${err.message}`);
        console.error(`   ${stmt.slice(0, 80)}...`);
      }
    }
  }
  console.log("");

  // 2. Inserts par batch de 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < insertStmts.length; i += BATCH_SIZE) {
    const batch = insertStmts.slice(i, i + BATCH_SIZE).map((sql) => ({ sql }));
    try {
      await client.batch(batch, "write");
      process.stdout.write(`\r  Inserts ${Math.min(i + BATCH_SIZE, insertStmts.length)}/${insertStmts.length}`);
    } catch (err) {
      console.error(`\n⚠️  Batch error at ${i}: ${err.message}`);
      // Fallback: essayer un par un
      for (const { sql } of batch) {
        try {
          await client.execute(sql);
        } catch (e2) {
          if (!e2.message.includes("UNIQUE constraint failed")) {
            console.error(`    Insert failed: ${e2.message}`);
          }
        }
      }
    }
  }
  console.log("");

  // Réactiver les foreign keys
  try {
    await client.execute("PRAGMA foreign_keys = ON");
    console.log("🔒 Foreign keys réactivées");
  } catch (e) {
    console.log("⚠️  Impossible de réactiver FK:", e.message);
  }

  console.log("✅ Import terminé !");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
