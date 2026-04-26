const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'src/app/admin/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/admin/ProspectsTab.tsx',
  'src/app/org/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/lists/page.tsx',
  'src/app/players/[id]/page.tsx',
  'src/app/watchlist/page.tsx',
  'src/app/leaderboards/page.tsx',
  'src/app/pricing/page.tsx',
  'src/app/prospects/page.tsx',
  'src/app/admin/SoloqPotwTab.tsx',
  'src/app/compare/page.tsx',
  'src/app/search/page.tsx',
  'src/app/about/page.tsx'
];

for (const relPath of filesToCheck) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  const iconNames = new Set();
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const names = m[1].split(',').map(n => n.trim()).filter(n => n);
    for (const n of names) iconNames.add(n);
  }
  
  if (iconNames.size === 0) continue;
  
  const lines = content.split('\n');
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/aria-hidden|aria-label|role=['"]img['"]/.test(line)) continue;
    
    for (const iconName of iconNames) {
      const pattern = '<' + iconName + '(?:\\s|>|/>|/)';
      const regex = new RegExp(pattern);
      if (regex.test(line)) {
        issues.push({ line: i + 1, icon: iconName });
        break;
      }
    }
  }
  
  if (issues.length > 0) {
    console.log('\n=== ' + relPath + ' (' + issues.length + ' issues) ===');
    for (const issue of issues) {
      console.log('  Line ' + issue.line + ': ' + issue.icon);
    }
  }
}
