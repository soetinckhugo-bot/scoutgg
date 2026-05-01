async function fetchWikitext(pageName: string): Promise<string> {
  const url = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "ScoutGG/1.0" } });
  const data = await res.json();
  return data.parse?.wikitext?.["*"] || "";
}

function parseRosters(wikitext: string) {
  const players: any[] = [];
  const lines = wikitext.split("\n");
  let currentTeam: string | null = null;
  let inRoster = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const teamMatch = line.match(/^\{\{TeamRoster\|team=([^\|\}]+)/);
    if (teamMatch) {
      currentTeam = teamMatch[1].trim();
      inRoster = true;
      continue;
    }

    if (inRoster && line === "}}") {
      currentTeam = null;
      inRoster = false;
      continue;
    }

    const playerMatch = line.match(/^\|\{\{TeamRoster\/Line\|player=([^\|]+)\|flag=([^\|]+)\|role=([^\}]+)\}\}/);
    if (playerMatch && currentTeam) {
      const playerName = playerMatch[1].trim();
      const flag = playerMatch[2].trim();
      const role = playerMatch[3].trim();
      if (role === "c") continue;
      players.push({ team: currentTeam, playerName, flag, role });
    }
  }

  return players;
}

async function main() {
  const wikitext = await fetchWikitext("LEC/2026_Season/Versus_Season");
  const rosterPlayers = parseRosters(wikitext);
  console.log("Total players (no coaches):", rosterPlayers.length);

  const byTeam = new Map<string, any[]>();
  for (const p of rosterPlayers) {
    if (!byTeam.has(p.team)) byTeam.set(p.team, []);
    byTeam.get(p.team)!.push(p);
  }

  for (const [team, players] of byTeam) {
    console.log(`${team}: ${players.length} players → ${players.map((p: any) => p.playerName).join(", ")}`);
  }
}

main().catch(console.error);
