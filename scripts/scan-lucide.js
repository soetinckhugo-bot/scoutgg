const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findFiles(fullPath, ext));
        } else if (entry.name.endsWith(ext)) {
            files.push(fullPath);
        }
    }
    return files;
}

const srcDir = path.join(process.cwd(), 'src');
const allFiles = [...findFiles(srcDir, '.tsx'), ...findFiles(srcDir, '.ts')];

const allResults = [];

for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
    const iconNames = new Set();
    let m;
    while ((m = importRegex.exec(content)) !== null) {
        const names = m[1].split(',').map(n => n.trim()).filter(n => n);
        for (const n of names) {
            iconNames.add(n);
        }
    }
    
    if (iconNames.size === 0) continue;
    
    const lines = content.split('\n');
    const fileIssues = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/aria-hidden|aria-label|role=["']img["']/.test(line)) continue;
        
        for (const iconName of iconNames) {
            const pattern = '<' + iconName + '(?:\\s|>|/>|/)';
            const regex = new RegExp(pattern);
            if (regex.test(line)) {
                fileIssues.push({ line: i + 1, icon: iconName, content: line.trim() });
                break;
            }
        }
    }
    
    if (fileIssues.length > 0) {
        allResults.push({ file: path.relative(process.cwd(), filePath), issues: fileIssues });
    }
}

allResults.sort((a, b) => b.issues.length - a.issues.length);

const top15 = allResults.slice(0, 15);
let totalIssues = 0;

for (const result of top15) {
    console.log('\n=== ' + result.file + ' (' + result.issues.length + ' issues) ===');
    totalIssues += result.issues.length;
    for (const issue of result.issues.slice(0, 15)) {
        console.log('  Line ' + issue.line + ': ' + issue.icon);
    }
    if (result.issues.length > 15) {
        console.log('  ... and ' + (result.issues.length - 15) + ' more');
    }
}

console.log('\n\nTotal files with issues: ' + top15.length);
console.log('Total issues in top 15 files: ' + totalIssues);
