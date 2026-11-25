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
   elegibles como universo GDT — las copas no llevan pool de planteles.

   lowerDivisions: 2ª y 3ª división (en ese orden) de la misma liga, para
   resolver los ASCENDIDOS que no figuran en el listado base. El listado
   base es de hace 2 temporadas: en ese lapso un club sube como mucho dos
   veces (3ª → 2ª → 1ª), así que 2ª + 3ª cubren a todos los posibles. Si la
   3ª está partida en grupos, van todos. IDs VERIFICADOS en vivo el
   2026-11-24 (todos con temporada 2024 disponible). La MLS no tiene
   ascensos: sin divisiones inferiores. */
export const API_FOOTBALL_LEAGUES = {
  4406: { id: 128, country: "Argentina", lowerDivisions: [129, 131, 134] }, // Liga Profesional · (Primera Nacional, Primera B Metro, Federal A)
  4351: { id: 71, country: "Brazil", lowerDivisions: [72, 75] }, // Brasileirão Serie A · (Serie B, Serie C)
  4346: { id: 253, country: "USA" }, // Major League Soccer
  4328: { id: 39, country: "England", lowerDivisions: [40, 41] }, // Premier League · (Championship, League One)
  4335: { id: 140, country: "Spain", lowerDivisions: [141, 435, 436] }, // La Liga · (Segunda, Primera RFEF grupos 1 y 2)
  4332: { id: 135, country: "Italy", lowerDivisions: [136, 138, 942, 943] }, // Serie A · (Serie B, Serie C gironi A/B/C)
  4331: { id: 78, country: "Germany", lowerDivisions: [79, 80] }, // Bundesliga · (2. Bundesliga, 3. Liga)
  4334: { id: 61, country: "France", lowerDivisions: [62, 63] }, // Ligue 1 · (Ligue 2, National)
  /* Competición de SELECCIONES (2026-11-09): la lista de equipos sale
     directo de API-Football (las 54 de la UEFA, verificadas en vivo con la
     temporada base) sin cruzar con TheSportsDB. El "plantel" de una
     selección es su última convocatoria (~23 jugadores). */
  4490: { id: 5, country: null, national: true }, // UEFA Nations League
  /* Temporadas por CICLO (2018, 2020, 2024…), no por año: el listado usa
     la última temporada disponible si la base no existe. Verificada en
     vivo el 2026-11-09 (ciclo 2026 terminado, ciclo 2030 sin cargar). */
  5518: { id: 32, country: null, national: true }, // Eliminatorias UEFA
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
  /* Brasileirão — VERIFICADOS en vivo el 2026-11-09 */
  "athletico paranaense": 134, // Atletico Paranaense (la búsqueda con "h" solo trae el femenino)
  "atletico mineiro": 1062, // Atletico-MG (el 117 "Atletico Mineiro" es un registro vacío)
};
