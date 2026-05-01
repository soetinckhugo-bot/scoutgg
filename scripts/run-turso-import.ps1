# Script PowerShell pour importer la base SQLite locale vers Turso
# Usage : lance ce fichier dans PowerShell, il te demande l'URL et le token

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Import ScoutGG DB -> Turso" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$url = Read-Host "Colle l'URL Turso (libsql://...)"
$token = Read-Host "Colle le Token Turso"

if (-not $url -or -not $token) {
    Write-Host "❌ URL et token sont obligatoires." -ForegroundColor Red
    exit 1
}

$env:TURSO_DATABASE_URL = $url
$env:TURSO_AUTH_TOKEN = $token

cd "$PSScriptRoot\.."
node scripts/import-dump-to-turso.js

Read-Host "Appuie sur Entrée pour fermer"
