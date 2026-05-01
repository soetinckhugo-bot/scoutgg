/**
 * Sync player data from Leaguepedia wiki page
 * Usage: npx tsx scripts/sync-leaguepedia.ts <playerId> <leaguepediaPageName>
 * Example: npx tsx scripts/sync-leaguepedia.ts cmoj5td5k01koglk0hni2i103 "Alvaro_(Álvaro_Fernández)"
 */
import { db } from "../src/lib/server/db";
import { writeFileSync } from "fs";
import { join } from "path";

const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

interface LeaguepediaData {
  realName: string | null;
  nationality: string | null;
  age: number | null;
  role: string | null;
  currentTeam: string | null;
  twitterUrl: string | null;
  twitchUrl: string | null;
  lolprosUrl: string | null;
  instagramUrl: string | null;
  photoUrl: string | null;
  leaguepediaUrl: string | null;
}

async function fetchLeaguepediaData(pageName: string): Promise<LeaguepediaData> {
  const headers = { "User-Agent": "ScoutGG/1.0 (scout@leaguescout.gg)" };

  // 1. Fetch wikitext
  const wikiUrl = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json&origin=*`;
  const wikiRes = await fetch(wikiUrl, { headers });
  const wikiData = await wikiRes.json();
  const wikitext = wikiData.parse?.wikitext?.["*"] || "";

  // Parse infobox
  const infobox: Record<string, string> = {};
  const lines = wikitext.match(/\{\{Infobox Player[\s\S]*?\}\}/)?.[0]?.split("\n") || [];
  for (const line of lines) {
    const match = line.match(/^\|(\w+)=\s*(.*)$/);
    if (match) {
      infobox[match[1]] = match[2].trim();
    }
  }

  // 2. Fetch HTML for team & image
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

  // Extract team from navbox
  const teamMatch = html.match(/Current[\s\S]*?<a[^>]+title="([^"]+)"[^>]*>[^<]*<\/a>/i);
  const currentTeam = teamMatch?.[1] || infobox.Team || null;

  // Calculate age
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
    leaguepediaUrl: `https://lol.fandom.com/wiki/${pageName}`,
  };
}

async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ScoutGG/1.0" } });
    if (!res.ok) {
      console.log(`Failed to download image: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);
    writeFileSync(filepath, buffer);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error("Download image error:", e);
    return null;
  }
}

function getImageExtension(url: string): string {
  // URLs like: .../Split_1.png/revision/latest?cb=...
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\/revision|\?|$)/);
  return match?.[1] || "png";
}

async function main() {
  const playerId = process.argv[2];
  const pageName = process.argv[3];

  if (!playerId || !pageName) {
    console.log("Usage: npx tsx scripts/sync-leaguepedia.ts <playerId> <leaguepediaPageName>");
    console.log('Example: npx tsx scripts/sync-leaguepedia.ts cmoj5td5k01koglk0hni2i103 "Alvaro_(Álvaro_Fernández)"');
    process.exit(1);
  }

  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) {
    console.log(`Player ${playerId} not found`);
    process.exit(1);
  }

  console.log(`Syncing ${player.pseudo} from Leaguepedia: ${pageName}`);

  const data = await fetchLeaguepediaData(pageName);

  console.log("Extracted data:");
  console.log(JSON.stringify(data, null, 2));

  // Download photo if found
  let localPhotoUrl = player.photoUrl;
  if (data.photoUrl) {
    const ext = getImageExtension(data.photoUrl);
    const filename = `${player.pseudo.toLowerCase().replace(/[^a-z0-9]/g, "_")}_leaguepedia.${ext}`;
    const downloaded = await downloadImage(data.photoUrl, filename);
    if (downloaded) {
      localPhotoUrl = downloaded;
      console.log(`Photo downloaded: ${downloaded}`);
    }
  }

  // Update player
  const updateData: Record<string, any> = {};
  if (data.realName && !player.realName) updateData.realName = data.realName;
  if (data.nationality && !player.nationality) updateData.nationality = data.nationality;
  if (data.age && !player.age) updateData.age = data.age;
  if (data.role && !player.role) updateData.role = data.role.toUpperCase();
  if (data.currentTeam && !player.currentTeam) updateData.currentTeam = data.currentTeam;
  if (data.twitterUrl && !player.twitterUrl) updateData.twitterUrl = data.twitterUrl;
  if (data.twitchUrl && !player.twitchUrl) updateData.twitchUrl = data.twitchUrl;
  if (data.lolprosUrl && !player.lolprosUrl) updateData.lolprosUrl = data.lolprosUrl;
  if (data.leaguepediaUrl && !player.leaguepediaUrl) updateData.leaguepediaUrl = data.leaguepediaUrl;
  if (localPhotoUrl && (!player.photoUrl || player.photoUrl !== localPhotoUrl)) {
    updateData.photoUrl = localPhotoUrl;
  }

  if (Object.keys(updateData).length === 0) {
    console.log("No new data to update.");
    process.exit(0);
  }

  const updated = await db.player.update({
    where: { id: playerId },
    data: updateData,
  });

  console.log("Updated fields:", Object.keys(updateData).join(", "));
  console.log(`Player ${updated.pseudo} synced successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
