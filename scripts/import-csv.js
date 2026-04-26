const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const db = new PrismaClient();

function parseNumber(val) {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parsePercent(val) {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  const clean = val.replace(/%/g, '').trim();
  const n = parseFloat(clean);
  return isNaN(n) ? null : n / 100;
}

function parseIntOrNull(val) {
  if (!val || val.trim() === '' || val.trim() === '-') return null;
  const n = parseInt(val.replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

function normalizeRole(pos) {
  const map = {
    Top: 'TOP', Jungle: 'JUNGLE', Middle: 'MID', ADC: 'ADC', Support: 'SUPPORT',
    TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', JGL: 'JUNGLE', SUP: 'SUPPORT', BOT: 'ADC'
  };
  return map[pos.trim()] || pos.toUpperCase();
}

async function main() {
  const csvPath = path.resolve('C:\\Users\\soeti\\Desktop\\SCOUTGG\\ROL_2026_Winter_FINAL.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());

  const league = 'ROL';
  const season = '2026';
  const split = 'Winter';

  let created = 0;
  let updated = 0;
  const errors = [];
  const players = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = vals[idx]);

    const pseudo = row.Player?.trim();
    if (!pseudo) continue;

    try {
      const games = parseIntOrNull(row.Games);
      const kda = parseNumber(row.KDA);
      const csdAt15 = parseNumber(row['CSD@15'] || row.CSD10);
      const gdAt15 = parseNumber(row['GD@15'] || row.GD10);
      const xpdAt15 = parseNumber(row['XPD@15'] || row.XPD10);
      const cspm = parseNumber(row.CSPM);
      const dpm = parseNumber(row.DPM);
      const kpPercent = parsePercent(row.KP);
      const visionScore = parseNumber(row['VS%']);
      const wpm = parseNumber(row.WPM);
      const wcpm = parseNumber(row.WCPM);
      const fbParticipation = parsePercent(row['FB%']);
      const fbVictim = parsePercent(row['FB Victim']);
      const damagePercent = parsePercent(row['DMG%']);
      const goldPercent = parsePercent(row['GOLD%']);
      const soloKills = parseNumber(row['Solo Kills']);
      const gpm = parseNumber(row.EGPM);

      let player = await db.player.findFirst({
        where: { pseudo: pseudo }
      });

      if (!player) {
        player = await db.player.create({
          data: {
            pseudo,
            role: normalizeRole(row.Pos || 'TOP'),
            league,
            currentTeam: row.Team || null,
            status: 'SCOUTING',
          }
        });
        created++;
      } else {
        updated++;
      }

      players.push(pseudo);

      // Delete existing proStats for this player/season/split to avoid unique constraint issues
      await db.proStats.deleteMany({
        where: { playerId: player.id, season, split }
      });

      await db.proStats.create({
        data: {
          playerId: player.id,
          kda,
          csdAt15,
          gdAt15,
          xpdAt15,
          cspm,
          gpm,
          dpm,
          kpPercent,
          visionScore,
          wpm,
          wcpm,
          fbParticipation,
          fbVictim,
          damagePercent,
          goldPercent,
          soloKills,
          gamesPlayed: games,
          season,
          split,
        }
      });

      console.log('✓', pseudo, '-', row.Pos, '-', row.Team);
    } catch (err) {
      errors.push(pseudo + ': ' + err.message);
      console.log('✗', pseudo, ':', err.message);
    }
  }

  console.log('');
  console.log('=== IMPORT COMPLETE ===');
  console.log('Created:', created);
  console.log('Updated:', updated);
  console.log('Errors:', errors.length);
  if (errors.length > 0) {
    errors.forEach(e => console.log('  -', e));
  }
}

main().catch(console.error).finally(() => db.$disconnect());
