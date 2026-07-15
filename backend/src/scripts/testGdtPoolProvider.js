/* Prueba del camino HÍBRIDO de planteles del pool GDT:
   TheSportsDB (lista de equipos vigentes) + API-Football (IDs y planteles).

     node src/scripts/testGdtPoolProvider.js [theSportsDbLeagueId]

   Default: 4406 (Liga Profesional Argentina). Trae la resolución completa
   de equipos y UN plantel de muestra — gasta pocas requests del día. */

import {
  getPoolLeagueTeams,
  getPoolTeamPlayers,
} from "../integrations/sportsProvider/apiFootballAdapter.js";

const leagueId = process.argv[2] || "4406";

const main = async () => {
  console.log(`=== Resolución de equipos (liga TheSportsDB ${leagueId}) ===`);
  const { teams, unresolvedTeams } = await getPoolLeagueTeams(leagueId);
  console.log(`Equipos resueltos: ${teams.length}`);
  for (const team of teams) {
    console.log(`  [${team.providerTeamId}] ${team.name}`);
  }
  if (unresolvedTeams.length > 0) {
    console.log(`\nSIN RESOLVER (${unresolvedTeams.length}):`);
    for (const name of unresolvedTeams) console.log(`  - ${name}`);
  } else {
    console.log("\nSin equipos pendientes: resolución 100%.");
  }

  const sample = teams[0];
  if (!sample) return;
  console.log(`\n=== Plantel de muestra: ${sample.name} ===`);
  const players = await getPoolTeamPlayers(sample.providerTeamId, sample.name);
  const byPosition = {};
  for (const player of players) {
    const key = player.position ?? "SIN POSICIÓN";
    byPosition[key] = (byPosition[key] ?? 0) + 1;
  }
  console.log(
    `${players.length} jugadores · ${Object.entries(byPosition)
      .map(([position, count]) => `${position}: ${count}`)
      .join(" · ")}`,
  );
  for (const player of players.slice(0, 8)) {
    console.log(
      `  ${player.name} · ${player.club} · ${player.position ?? "—"} · foto: ${player.photoUrl ? "sí" : "no"}`,
    );
  }
};

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
