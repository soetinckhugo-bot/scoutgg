// Fetch ROL Winter 2026 player photos from Leaguepedia (direct URLs)
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../public/uploads");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function tryDownloadImage(playerName, outputPath) {
  const encoded = encodeURIComponent(playerName);
  const variations = [
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}face.png`,
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}faces.png`,
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}Face.png`,
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}Faces.png`,
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}face.jpg`,
    `https://lol.fandom.com/wiki/Special:FilePath/${encoded}faces.jpg`,
  ];

  for (const url of variations) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("image")) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 2000) continue;
      fs.writeFileSync(outputPath, buffer);
      return url;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  // Get players from the tournament
  const tournamentUrl =
    "https://lol.fandom.com/wiki/Special:CargoExport?tables=ScoreboardPlayers=SP&fields=SP.Name,SP.Team&where=SP.OverviewPage='Road%20Of%20Legends/2026%20Season/Winter%20Split'&group%20by=SP.Name&format=json";

  const players = await fetchJson(tournamentUrl);
  console.log(`Found ${players.length} players in tournament\n`);

  const results = [];
  for (const p of players) {
    const pseudoLower = p.Name.toLowerCase().replace(/\s+/g, "_");
    const outputPath = path.join(OUTPUT_DIR, `${pseudoLower}_leaguepedia.png`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Already exists: ${p.Name}`);
      results.push({ name: p.Name, status: "exists" });
      continue;
    }

    const url = await tryDownloadImage(p.Name, outputPath);
    if (url) {
      console.log(`✅ Downloaded: ${p.Name}`);
      results.push({ name: p.Name, status: "downloaded", url });
    } else {
      console.log(`❌ Not found: ${p.Name}`);
      results.push({ name: p.Name, status: "not-found" });
    }

    // Small delay to be polite
    await new Promise((r) => setTimeout(r, 300));
  }

  const downloaded = results.filter((r) => r.status === "downloaded").length;
  const exists = results.filter((r) => r.status === "exists").length;
  const notFound = results.filter((r) => r.status === "not-found").length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already existed: ${exists}`);
  console.log(`Not found: ${notFound}`);

  fs.writeFileSync(
    path.join(__dirname, "rol-winter-photos.json"),
    JSON.stringify(results, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
