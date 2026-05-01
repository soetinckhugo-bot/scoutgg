async function main() {
  const pageName = 'Alvaro_(Álvaro_Fernández)';
  
  const htmlUrl = `https://lol.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=text&format=json&origin=*`;
  const htmlRes = await fetch(htmlUrl, { headers: { 'User-Agent': 'ScoutGG/1.0' } });
  const htmlData = await htmlRes.json();
  const html = htmlData.parse?.text?.['*'] || '';
  
  console.log('=== TEAM PARSING ===');
  
  // Cherche la team dans différents patterns
  const patterns = [
    /Current[\s\S]*?<a[^>]+title="([^"]+)"[^>]*>[^<]*<\/a>/i,
    /Team[\s\S]*?<a[^>]+title="([^"]+)"[^>]*>[^<]*<\/a>/i,
    /class="infobox-team"[\s\S]*?<a[^>]+>([^<]+)<\/a>/i,
  ];
  
  for (const p of patterns) {
    const m = html.match(p);
    if (m) {
      console.log('Team match:', m[1]);
    }
  }
  
  // Affiche un extrait du HTML autour de "Current"
  const idx = html.indexOf('Current');
  if (idx !== -1) {
    console.log('HTML around Current:', html.slice(Math.max(0, idx-200), idx+300));
  }
}

main().catch(console.error);
