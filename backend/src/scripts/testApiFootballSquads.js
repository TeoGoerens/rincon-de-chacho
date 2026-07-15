/* Prueba de calidad de API-Football (api-sports.io) como fuente de PLANTELES
   para el pool GDT, antes de decidir el plan híbrido (TheSportsDB sigue para
   fixtures/resultados). Uso:

     node src/scripts/testApiFootballSquads.js

   Verifica: ① estado de la cuenta y límites del plan free; ② ligas
   argentinas disponibles; ③ si el listado de equipos por liga+temporada
   funciona en el plan free (restricción de temporadas); ④ planteles
   completos de River y Atlético Tucumán (frescura + sin duplicados). */

import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

if (!API_KEY) {
  console.error("Falta API_FOOTBALL_KEY en el .env");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );
  const response = await fetch(url, {
    headers: { "x-apisports-key": API_KEY },
  });
  const remaining = response.headers.get("x-ratelimit-requests-remaining");
  const data = await response.json();
  return { data, remaining, httpStatus: response.status };
};

const printSquad = (teamName, squadResponse) => {
  const squad = squadResponse?.[0];
  if (!squad) {
    console.log(`  (sin datos de plantel para ${teamName})`);
    return;
  }
  const players = squad.players ?? [];
  console.log(
    `\n=== Plantel de ${squad.team?.name} (id ${squad.team?.id}) — ${players.length} jugadores ===`,
  );
  const byPosition = {};
  for (const player of players) {
    byPosition[player.position] = byPosition[player.position] ?? [];
    byPosition[player.position].push(player);
  }
  for (const [position, list] of Object.entries(byPosition)) {
    console.log(`\n  ${position} (${list.length}):`);
    for (const player of list) {
      console.log(
        `    #${player.number ?? "—"} ${player.name} · ${player.age} años · foto: ${player.photo ? "sí" : "no"}`,
      );
    }
  }
};

const main = async () => {
  /* ① Estado de la cuenta */
  const status = await fetchJson("/status");
  const account = status.data?.response;
  console.log("=== Cuenta ===");
  console.log(
    `  Plan: ${account?.subscription?.plan} · activo: ${account?.subscription?.active}`,
  );
  console.log(
    `  Requests hoy: ${account?.requests?.current} de ${account?.requests?.limit_day}`,
  );
  await sleep(800);

  /* ② Ligas argentinas */
  const leagues = await fetchJson("/leagues", { country: "Argentina" });
  console.log("\n=== Ligas de Argentina (primeras 8) ===");
  for (const item of (leagues.data?.response ?? []).slice(0, 8)) {
    const currentSeason = (item.seasons ?? []).find((s) => s.current);
    console.log(
      `  [${item.league.id}] ${item.league.name} · temporada actual: ${currentSeason?.year ?? "?"}`,
    );
  }
  const ligaProfesional = (leagues.data?.response ?? []).find((item) =>
    /liga profesional|primera division/i.test(item.league.name),
  );
  await sleep(800);

  /* ③ Equipos por liga+temporada (acá pega la restricción del plan free) */
  if (ligaProfesional) {
    const currentSeason =
      (ligaProfesional.seasons ?? []).find((s) => s.current)?.year ??
      new Date().getFullYear();
    const teams = await fetchJson("/teams", {
      league: ligaProfesional.league.id,
      season: currentSeason,
    });
    const teamList = teams.data?.response ?? [];
    const errors = teams.data?.errors;
    console.log(
      `\n=== Equipos de ${ligaProfesional.league.name} temporada ${currentSeason} ===`,
    );
    if (teamList.length > 0) {
      console.log(`  ${teamList.length} equipos:`);
      for (const item of teamList) {
        console.log(`    [${item.team.id}] ${item.team.name}`);
      }
    } else {
      console.log(
        `  VACÍO — errores del API: ${JSON.stringify(errors ?? {})}`,
      );
    }
    await sleep(800);
  }

  /* ④ Planteles puntuales: River y Atlético Tucumán vía búsqueda */
  for (const searchTerm of ["River Plate", "Atletico Tucuman"]) {
    const teams = await fetchJson("/teams", { search: searchTerm });
    const matches = (teams.data?.response ?? []).filter(
      (item) => item.team.country === "Argentina",
    );
    console.log(`\n=== Búsqueda "${searchTerm}" (Argentina) ===`);
    for (const item of matches) {
      console.log(`  [${item.team.id}] ${item.team.name}`);
    }
    const team = matches[0];
    if (!team) continue;
    await sleep(800);

    const squad = await fetchJson("/players/squads", { team: team.team.id });
    printSquad(team.team.name, squad.data?.response);
    if (squad.data?.errors && Object.keys(squad.data.errors).length > 0) {
      console.log(`  Errores del API: ${JSON.stringify(squad.data.errors)}`);
    }
    await sleep(800);
  }

  const finalStatus = await fetchJson("/status");
  console.log(
    `\nRequests consumidas hoy: ${finalStatus.data?.response?.requests?.current} de ${finalStatus.data?.response?.requests?.limit_day}`,
  );
};

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
