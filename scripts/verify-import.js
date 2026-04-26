const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const scouting = await db.player.count({ where: { status: 'SCOUTING' } });
  const rol = await db.player.count({ where: { league: 'ROL' } });

  console.log('Players with SCOUTING status:', scouting);
  console.log('ROL league players:', rol);

  const sample = await db.player.findFirst({
    where: { league: 'ROL' },
    include: { proStats: true }
  });

  if (sample) {
    console.log('');
    console.log('Sample player:', sample.pseudo);
    console.log('  Status:', sample.status);
    console.log('  Role:', sample.role);
    console.log('  Team:', sample.currentTeam);
    console.log('  ProStats:', sample.proStats ? 'Yes' : 'No');
    if (sample.proStats) {
      console.log('    KDA:', sample.proStats.kda);
      console.log('    Games:', sample.proStats.gamesPlayed);
      console.log('    Season:', sample.proStats.season, '-', sample.proStats.split);
    }
  }

  // List all ROL players
  console.log('');
  console.log('=== All ROL Players ===');
  const allRol = await db.player.findMany({
    where: { league: 'ROL' },
    orderBy: { pseudo: 'asc' },
    include: { proStats: true }
  });
  allRol.forEach(p => {
    const stats = p.proStats ? `${p.proStats.gamesPlayed}g KDA:${p.proStats.kda?.toFixed(2) || '?'}` : 'no stats';
    console.log(`  ${p.pseudo} | ${p.role} | ${p.currentTeam || 'N/A'} | ${p.status} | ${stats}`);
  });
}

main().catch(console.error).finally(() => db.$disconnect());
