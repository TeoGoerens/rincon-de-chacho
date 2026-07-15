// Prueba manual de la capa sportsProvider (paso 2.1) sin HTTP ni auth.
// Uso: node src/scripts/testSportsProvider.js [leagueId] [finishedEventId]
import {
  getSupportedLeagues,
  getUpcomingEventsByLeague,
  getEventResult,
} from "../integrations/sportsProvider/index.js";

const leagueId = process.argv[2] || "4406";
const finishedEventId = process.argv[3] || "2475052"; // River 2-3 Belgrano (24/05/2026)

const formatArgentina = (iso) =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

const run = async () => {
  console.log("=== Ligas soportadas ===");
  getSupportedLeagues().forEach((league) =>
    console.log(`  ${league.id}  ${league.name}`),
  );

  console.log(`\n=== Próximos partidos (liga ${leagueId}) ===`);
  const events = await getUpcomingEventsByLeague(leagueId);
  if (!events.length) console.log("  (sin partidos próximos)");
  events.forEach((event) =>
    console.log(
      `  [${event.providerEventId}] ${formatArgentina(event.kickoff)} hs ARG · ${event.homeTeam} vs ${event.awayTeam} · fecha ${event.round} · ${event.status}`,
    ),
  );

  console.log(`\n=== Resultado puntual (evento ${finishedEventId}) ===`);
  const result = await getEventResult(finishedEventId);
  console.log(
    `  ${result.homeTeam} ${result.homeScore ?? "-"} - ${result.awayScore ?? "-"} ${result.awayTeam} · ${result.status}`,
  );
};

run().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
