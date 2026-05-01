/**
 * Import all LCS 2026 Lock-In player rosters from Leaguepedia
 * Excludes coaches.
 */
import { db } from "../src/lib/server/db";
import { writeFileSync } from "fs";
import { join } from "path";

const TOURNAMENT_PAGE = "LCS/2026_Season/Lock-In";
const ROLE_MAP: Record<string, string> = { t: "TOP", j: "JUNGLE", m: "MID", a: "ADC", s: "SUPPORT" };
const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

interface RosterPlayer {
  team: string;
  playerName: string;
  flag: string;
  role: string;
}

async function fetchWikitext(pageName: string): Promise<string> {
  const url = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "ScoutGG/1.0" } });
  const data = await res.json();
  return data.parse?.wikitext?.["*"] || "";
}

function parseRosters(wikitext: string): RosterPlayer[] {
  const players: RosterPlayer[] = [];
  const lines = wikitext.split("\n");
  let currentTeam: string | null = null;
  let inRoster = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Start of team roster
    const teamMatch = line.match(/^\{\{TeamRoster\|team=([^\|\}]+)/);
    if (teamMatch) {
      currentTeam = teamMatch[1].trim();
      inRoster = true;
      continue;
    }

    // End of roster block
    if (inRoster && line === "}}") {
      currentTeam = null;
      inRoster = false;
      continue;
    }

    // Player line
    const playerMatch = line.match(/^\|\{\{TeamRoster\/Line\|player=([^\|]+)\|flag=([^\|]+)\|role=([^\}]+)\}\}/);
    if (playerMatch && currentTeam) {
      const playerName = playerMatch[1].trim();
      const flag = playerMatch[2].trim();
      const role = playerMatch[3].trim();
      if (role === "c") continue; // Skip coaches
      players.push({ team: currentTeam, playerName, flag, role });
    }
  }

  return players;
}

async function fetchPlayerInfobox(pageName: string) {
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

  // Extract the LARGEST image from the HTML — player photos are ~200px+,
  // team logos and icons are 36-60px. This avoids grabbing the wrong image.
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

  const teamMatch = html.match(/Current[\s\S]*?<a[^>]+title="([^"]+)"[^>]*>[^<]*<\/a>/i);
  const currentTeam = teamMatch?.[1] || infobox.Team || null;

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
    role: infobox.role || null,
    currentTeam,
    twitterUrl: infobox.twitter ? `https://twitter.com/${infobox.twitter}` : null,
    twitchUrl: infobox.stream || null,
    lolprosUrl: infobox.lolpros || null,
    instagramUrl: infobox.instagram ? `https://instagram.com/${infobox.instagram}` : null,
    photoUrl,
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
  console.log("Fetching tournament wikitext...");
  const wikitext = await fetchWikitext(TOURNAMENT_PAGE);
  const rosterPlayers = parseRosters(wikitext);

  console.log(`Found ${rosterPlayers.length} players (coaches excluded)`);

  const byTeam = new Map<string, RosterPlayer[]>();
  for (const p of rosterPlayers) {
    if (!byTeam.has(p.team)) byTeam.set(p.team, []);
    byTeam.get(p.team)!.push(p);
  }
  for (const [team, players] of byTeam) {
    console.log(`  ${team}: ${players.map((p) => p.playerName).join(", ")}`);
  }

  const existingPlayers = await db.player.findMany({
    where: { league: "LCS" },
    select: { id: true, pseudo: true },
  });
  const existingByPseudo = new Map(existingPlayers.map((p) => [p.pseudo.toLowerCase(), p.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const rp of rosterPlayers) {
    if (rp.playerName.toLowerCase().includes("alvaro")) {
      console.log(`\n⏭ Skipping Alvaro (already synced)`);
      skipped++;
      continue;
    }

    const pseudo = rp.playerName.split("(")[0].trim();
    console.log(`\nProcessing ${pseudo} (${rp.team}, ${rp.role})...`);

    const pageName = await resolvePageName(rp.playerName);
    if (!pageName) {
      console.log(`  ❌ Could not resolve Leaguepedia page for ${rp.playerName}`);
      failed++;
      continue;
    }

    let lpData;
    try {
      lpData = await fetchPlayerInfobox(pageName);
    } catch (e) {
      console.log(`  ❌ Error fetching Leaguepedia data:`, e);
      failed++;
      continue;
    }

    const existingId = existingByPseudo.get(pseudo.toLowerCase());

    if (existingId) {
      const updateData: Record<string, any> = {};
      if (lpData.realName) updateData.realName = lpData.realName;
      if (lpData.nationality) updateData.nationality = lpData.nationality;
      if (lpData.age) updateData.age = lpData.age;
      if (lpData.currentTeam) updateData.currentTeam = lpData.currentTeam;
      if (lpData.twitterUrl) updateData.twitterUrl = lpData.twitterUrl;
      if (lpData.twitchUrl) updateData.twitchUrl = lpData.twitchUrl;
      if (lpData.lolprosUrl) updateData.lolprosUrl = lpData.lolprosUrl;
      updateData.leaguepediaUrl = `https://lol.fandom.com/wiki/${pageName}`;
      if (lpData.photoUrl) {
        const ext = getImageExtension(lpData.photoUrl);
        const filename = `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, "_")}_leaguepedia.${ext}`;
        const localUrl = await downloadImage(lpData.photoUrl, filename);
        if (localUrl) updateData.photoUrl = localUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await db.player.update({ where: { id: existingId }, data: updateData });
        console.log(`  ✅ Updated: ${Object.keys(updateData).join(", ")}`);
      } else {
        console.log(`  ⏭ No new data to update`);
      }
      updated++;
    } else {
      const newPlayer = await db.player.create({
        data: {
          pseudo,
          realName: lpData.realName,
          role: ROLE_MAP[rp.role] || "SUPPORT",
          nationality: lpData.nationality || rp.flag.toUpperCase(),
          age: lpData.age,
          currentTeam: lpData.currentTeam || rp.team,
          league: "LCS",
          status: "UNDER_CONTRACT",
          twitterUrl: lpData.twitterUrl,
          twitchUrl: lpData.twitchUrl,
          lolprosUrl: lpData.lolprosUrl,
          leaguepediaUrl: `https://lol.fandom.com/wiki/${pageName}`,
          photoUrl: null,
        },
      });

      if (lpData.photoUrl) {
        const ext = getImageExtension(lpData.photoUrl);
        const filename = `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, "_")}_leaguepedia.${ext}`;
        const localUrl = await downloadImage(lpData.photoUrl, filename);
        if (localUrl) {
          await db.player.update({ where: { id: newPlayer.id }, data: { photoUrl: localUrl } });
        }
      }

      console.log(`  ✅ Created player ${newPlayer.id}`);
      existingByPseudo.set(pseudo.toLowerCase(), newPlayer.id);
      created++;
    }

    await sleep(500);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
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
