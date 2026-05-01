async function main() {
  const url = `https://lol.fandom.com/api.php?action=parse&page=LEC/2026_Season/Versus_Season&prop=wikitext&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "ScoutGG/1.0" } });
  const data = await res.json();
  const text = data.parse?.wikitext?.["*"] || "";
  
  const lines = text.split("\n");
  let inRoster = false;
  let count = 0;
  for (const line of lines) {
    if (line.includes("TeamRoster")) {
      inRoster = true;
      count = 0;
    }
    if (inRoster && count < 15) {
      console.log(JSON.stringify(line));
      count++;
    }
    if (inRoster && count >= 15) {
      inRoster = false;
      console.log("---");
    }
  }
}

main().catch(console.error);
