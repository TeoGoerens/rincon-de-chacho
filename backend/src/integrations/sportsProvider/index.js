// Contrato del proveedor deportivo. El resto del backend importa SOLO de acá:
// cambiar de proveedor (o de key) no debe tocar controllers ni repositories.
// Plan HÍBRIDO (2026-07-09): TheSportsDB para fixtures/resultados;
// API-Football para los planteles del pool GDT.
export {
  getSupportedLeagues,
  getUpcomingEventsByLeague,
  getEventResult,
  getLeagueTeams,
  getTeamPlayers,
} from "./theSportsDbAdapter.js";
export {
  getPoolLeagueTeams,
  getPoolTeamPlayers,
} from "./apiFootballAdapter.js";
