import dotenv from "dotenv";
dotenv.config();

/* API-Football (api-sports.io) — SOLO para importar PLANTELES del pool GDT
   (plan híbrido, decisión del dueño 2026-07-09): TheSportsDB (key lifetime)
   sigue siendo la fuente de fixtures y resultados, pero sus planteles son
   de mantenimiento comunitario (desactualizados, clubes duplicados). */

export const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

/* El plan free no lista los equipos de temporadas recientes ("try from 2022
   to 2024" en 2026): la temporada base para el listado es año actual - 2.
   Los equipos que cambiaron desde entonces (ascendidos) se resuelven por
   búsqueda individual. En plan pago este mismo flujo funciona igual. */
export const teamListSeason = () => new Date().getFullYear() - 2;

/* Liga TheSportsDB (leagueProviderId del universo) → liga API-Football.
   IDs y países VERIFICADOS en vivo contra la API el 2026-07-09. Solo ligas
   elegibles como universo GDT — las copas no llevan pool de planteles. */
export const API_FOOTBALL_LEAGUES = {
  4406: { id: 128, country: "Argentina" }, // Liga Profesional Argentina
  4351: { id: 71, country: "Brazil" }, // Brasileirão Serie A
  4346: { id: 253, country: "USA" }, // Major League Soccer
  4328: { id: 39, country: "England" }, // Premier League
  4335: { id: 140, country: "Spain" }, // La Liga
  4332: { id: 135, country: "Italy" }, // Serie A
  4331: { id: 78, country: "Germany" }, // Bundesliga
  4334: { id: 61, country: "France" }, // Ligue 1
};

/* Equipos cuyo nombre difiere tanto entre TheSportsDB y API-Football que ni
   el match normalizado ni la búsqueda los resuelven solos. Clave: nombre
   TheSportsDB normalizado (minúsculas, sin tildes ni apóstrofes) → ID de
   equipo en API-Football. IDs VERIFICADOS en vivo el 2026-07-09. Si un
   import reporta un equipo sin resolver (ascendidos nuevos, etc.), la
   solución es agregar una línea acá. */
export const API_FOOTBALL_TEAM_ALIASES = {
  "estudiantes de la plata": 450, // Estudiantes L.P.
  "gimnasia y esgrima de la plata": 434, // Gimnasia L.P.
  "argentinos juniors": 458, // Argentinos JRS
  "talleres de cordoba": 456, // Talleres Cordoba
  "independiente rivadavia": 473, // Independ. Rivadavia
  "central cordoba de santiago del estero": 1065, // Central Cordoba de Santiago
  "gimnasia y esgrima de mendoza": 1066, // Gimnasia M.
};
