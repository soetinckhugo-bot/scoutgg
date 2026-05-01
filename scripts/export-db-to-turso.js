/**
 * Exporte la base SQLite locale (prisma/dev.db) en un fichier SQL
 * compatible avec Turso / libSQL.
 *
 * Usage : node scripts/export-db-to-turso.js
 * Sortie : prisma/dump-for-turso.sql
 */

const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "prisma", "dev.db");
const OUTPUT_PATH = path.join(__dirname, "..", "prisma", "dump-for-turso.sql");

if (!fs.existsSync(DB_PATH)) {
  console.error("❌ Base introuvable :", DB_PATH);
  process.exit(1);
}

const db = new Database(DB_PATH);
const out = [];

out.push("-- ScoutGG Dump for Turso / libSQL");
out.push(`-- Generated: ${new Date().toISOString()}`);
out.push("");

// 1. Schéma (tables + indexes)
const schemaRows = db
  .prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type DESC, name")
  .all();

for (const row of schemaRows) {
  // On saute les instructions internes SQLite
  if (row.sql.includes("sqlite_sequence")) continue;
  out.push(row.sql + ";");
}

out.push("");

// 2. Données — INSERT par table
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations'")
  .all()
  .map((r) => r.name);

for (const table of tables) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const colNames = columns.map((c) => c.name).join(", ");

  const rows = db.prepare(`SELECT * FROM "${table}"`).all();
  if (rows.length === 0) continue;

  out.push(`-- ${table}: ${rows.length} row(s)`);

  for (const row of rows) {
    const values = columns.map((col) => {
      const val = row[col.name];
      if (val === null || val === undefined) return "NULL";
      if (typeof val === "number" || typeof val === "bigint") return val;
      if (typeof val === "boolean") return val ? 1 : 0;
      // Date stockée en ISO → string
      const escaped = String(val).replace(/'/g, "''");
      return `'${escaped}'`;
    });

    out.push(`INSERT INTO "${table}" (${colNames}) VALUES (${values.join(", ")});`);
  }

  out.push("");
}

fs.writeFileSync(OUTPUT_PATH, out.join("\n"), "utf-8");
console.log(`✅ Dump créé : ${OUTPUT_PATH}`);
console.log(`   Tables exportées : ${tables.length}`);
console.log("");
console.log("Prochaines étapes Turso :");
console.log("  1. turso db create scoutgg-prod");
console.log("  2. turso db shell scoutgg-prod < prisma/dump-for-turso.sql");
console.log("  3. turso db tokens create scoutgg-prod");
console.log("  4. Configurer TURSO_DATABASE_URL + TURSO_AUTH_TOKEN sur Vercel");
