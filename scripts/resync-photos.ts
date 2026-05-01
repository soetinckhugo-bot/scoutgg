/**
 * Resync photos and leaguepediaUrl for existing LEC players
 * Uses the corrected image extraction (largest image in HTML)
 */
import { db } from "../src/lib/server/db";
import { writeFileSync } from "fs";
import { join } from "path";

const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

async function fetchPlayerData(pageName: string) {
  const headers = { "User-Agent": "ScoutGG/1.0 (scout@leaguescout.gg)" };

  const wikiUrl = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json&origin=*`;
  const wikiRes = await fetch(wikiUrl, { headers });
  const wikiData = await wikiRes.json();
  const wikitext = wikiData.parse?.wikitext?.["*"] || "";

  const infobox: Record<string, string> = {};
  const infoboxLines = wikitext.match(/\{\{Infobox Player[\s\S]*?\}\}/)?.[0]?.split("\n") || [];
  for (const line of infoboxLines) {
    const m = line.match(/^\|(\w+)=\s*(.*)$/);
    if (m) infobox[m[1]] = m[2].trim();
  }

  const htmlUrl = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=text&format=json&origin=*`;
  const htmlRes = await fetch(htmlUrl, { headers });
  const htmlData = await htmlRes.json();
  const html = htmlData.parse?.text?.["*"] || "";

  // Extract the LARGEST image — player photos are ~200px+, logos are 36-60px
  let photoUrl: string | null = null;
  const imgMatches = [...html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi)];
  let bestWidth = 0;
  for (const img of imgMatches) {
    const widthMatch = img[0].match(/width="(\d+)"/);
    const width = widthMatch ? parseInt(widthMatch[1]) : 0;
    if (width > bestWidth) {
      bestWidth = width;
      photoUrl = img[1];
    }
  }
  if (photoUrl) {
    photoUrl = photoUrl.replace(/\/revision\/latest\/scale-to-width-down\/\d+/, "/revision/latest");
    if (photoUrl.startsWith("//")) photoUrl = "https:" + photoUrl;
  }

  let age: number | null = null;
  if (infobox.birth_date_year && infobox.birth_date_month && infobox.birth_date_day) {
    const birth = new Date(
      parseInt(infobox.birth_date_year),
      MONTH_MAP[infobox.birth_date_month] ?? 0,
      parseInt(infobox.birth_date_day)
    );
    age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  return {
    realName: infobox.name || null,
    nationality: infobox.country || null,
    age,
    photoUrl,
    leaguepediaUrl: `https://lol.fandom.com/wiki/${pageName}`,
  };
}

function getImageExtension(url: string): string {
  const m = url.match(/\.([a-zA-Z0-9]+)(?:\/revision|\?|$)/);
  return m?.[1] || "png";
}

async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ScoutGG/1.0" } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);
    writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch {
    return null;
  }
}

async function resolvePageName(playerName: string): Promise<string | null> {
  if (playerName.includes("(")) return playerName;
  const directUrl = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(playerName)}&prop=wikitext&format=json&origin=*`;
  const directRes = await fetch(directUrl, { headers: { "User-Agent": "ScoutGG/1.0" } });
  const directData = await directRes.json();
  if (directData.parse?.wikitext?.["*"]) return playerName;
  return null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const players = await db.player.findMany({
    where: { league: "LEC" },
    select: { id: true, pseudo: true, photoUrl: true, leaguepediaUrl: true, realName: true, nationality: true, age: true },
  });

  console.log(`Found ${players.length} LEC players to resync`);

  let updated = 0;
  let failed = 0;

  for (const player of players) {
    // Skip if already has a photo that looks real (>5000 bytes or external URL)
    if (player.photoUrl && !player.photoUrl.includes("_leaguepedia")) {
      console.log(`⏭ ${player.pseudo}: has external photo`);
      continue;
    }

    const pageName = await resolvePageName(player.pseudo);
    if (!pageName) {
      console.log(`❌ ${player.pseudo}: could not resolve page`);
      failed++;
      continue;
    }

    console.log(`Syncing ${player.pseudo}...`);
    let data;
    try {
      data = await fetchPlayerData(pageName);
    } catch (e) {
      console.log(`  ❌ Error:`, e);
      failed++;
      continue;
    }

    const updateData: Record<string, any> = {};
    if (data.realName && !player.realName) updateData.realName = data.realName;
    if (data.nationality && !player.nationality) updateData.nationality = data.nationality;
    if (data.age && !player.age) updateData.age = data.age;
    if (!player.leaguepediaUrl) updateData.leaguepediaUrl = data.leaguepediaUrl;

    if (data.photoUrl) {
      const ext = getImageExtension(data.photoUrl);
      const filename = `${player.pseudo.toLowerCase().replace(/[^a-z0-9]/g, "_")}_leaguepedia.${ext}`;
      const localUrl = await downloadImage(data.photoUrl, filename);
      if (localUrl) {
        updateData.photoUrl = localUrl;
        console.log(`  📸 Photo: ${localUrl}`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.player.update({ where: { id: player.id }, data: updateData });
      console.log(`  ✅ Updated: ${Object.keys(updateData).join(", ")}`);
      updated++;
    } else {
      console.log(`  ⏭ No changes`);
    }

    await sleep(500);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
