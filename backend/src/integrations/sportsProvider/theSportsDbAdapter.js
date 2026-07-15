import {
  THESPORTSDB_API_KEY,
  THESPORTSDB_BASE_URL,
  REQUEST_GAP_MS,
  RETRY_DELAY_MS,
  UPCOMING_CACHE_TTL_MS,
  NEXT_ROUND_WINDOW_DAYS,
  SUPPORTED_LEAGUES,
} from "../../config/sportsProvider/theSportsDbConfig.js";

const FINISHED_STATUSES = new Set([
  "FT",
  "AET",
  "PEN",
  "Match Finished",
  "Finished",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestAt = 0;

const fetchJson = async (endpoint, params = {}, isRetry = false) => {
  const wait = lastRequestAt + REQUEST_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const url = new URL(
    `${THESPORTSDB_BASE_URL}/${THESPORTSDB_API_KEY}/${endpoint}`,
  );
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  const response = await fetch(url);
  if (!response.ok) {
    if (!isRetry && (response.status === 429 || response.status === 503)) {
      await sleep(RETRY_DELAY_MS);
      return fetchJson(endpoint, params, true);
    }
    throw new Error(
      `TheSportsDB respondió ${response.status} al consultar ${endpoint}`,
    );
  }
  return response.json();
};

// strTimestamp viene en UTC sin offset ("2026-07-26T20:00:00")
const toKickoffIso = (event) => {
  const raw =
    event.strTimestamp ||
    (event.dateEvent && event.strTime
      ? `${event.dateEvent}T${event.strTime}`
      : null);
  if (!raw) return null;
  const date = new Date(raw.endsWith("Z") ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toScore = (value) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

const toStatus = (event, kickoff, homeScore, awayScore) => {
  if (FINISHED_STATUSES.has(event.strStatus)) return "finished";
  if (event.strPostponed === "yes") return "postponed";
  if (homeScore !== null && awayScore !== null) {
    // Partidos viejos sin strStatus: marcador cargado y kickoff lejano = terminado
    const kickedOffLongAgo =
      kickoff && Date.now() - new Date(kickoff).getTime() > THREE_HOURS_MS;
    return kickedOffLongAgo ? "finished" : "inplay";
  }
  return "scheduled";
};

const normalizeEvent = (event) => {
  const homeScore = toScore(event.intHomeScore);
  const awayScore = toScore(event.intAwayScore);
  const kickoff = toKickoffIso(event);
  return {
    providerEventId: event.idEvent,
    leagueId: event.idLeague,
    leagueName: event.strLeague,
    season: event.strSeason,
    round: event.intRound,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    kickoff,
    status: toStatus(event, kickoff, homeScore, awayScore),
    homeScore,
    awayScore,
  };
};

const cache = new Map();

const withCache = async (key, loader) => {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + UPCOMING_CACHE_TTL_MS });
  return value;
};

const assertSupportedLeague = (leagueId) => {
  if (!SUPPORTED_LEAGUES.some((league) => league.id === String(leagueId))) {
    throw new Error("La liga no está dentro del catálogo soportado");
  }
};

export const getSupportedLeagues = () => SUPPORTED_LEAGUES;

export const getUpcomingEventsByLeague = async (leagueId) => {
  assertSupportedLeague(leagueId);

  return withCache(`upcoming:${leagueId}`, async () => {
    /* Con key premium eventsnextleague trae los próximos ~20 partidos y
       eventsround da 404 (endpoint legacy, mismo caso que lookup_all_teams,
       verificado 2026-07-09) → se filtra directo de esa lista. Con la key
       gratuita "123" trae 1 solo evento (alcanza para conocer fecha y
       temporada en curso) y la fecha completa sale de eventsround. Ambos
       caminos aplican el mismo criterio de horizonte: la fecha en curso
       SIEMPRE (aunque un receso la deje lejos: es lo próximo real que hay),
       la siguiente solo dentro de la ventana. */
    const nextData = await fetchJson("eventsnextleague.php", { id: leagueId });
    const nextEvents = nextData.events || [];
    const nextEvent = nextEvents[0];
    if (!nextEvent) return [];

    const now = Date.now();
    const windowLimit = now + NEXT_ROUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const collected = new Map();

    const addEvent = (rawEvent, { onlyWithinWindow }) => {
      const event = normalizeEvent(rawEvent);
      if (!event.kickoff) return;
      const kickoffMs = new Date(event.kickoff).getTime();
      if (kickoffMs < now) return;
      if (onlyWithinWindow && kickoffMs > windowLimit) return;
      collected.set(event.providerEventId, event);
    };

    const currentRound = String(nextEvent.intRound ?? "");
    const numericRound = Number(nextEvent.intRound);
    const followingRound = Number.isInteger(numericRound)
      ? String(numericRound + 1)
      : null;

    if (THESPORTSDB_API_KEY !== "123") {
      /* Si una fecha tuviera más partidos futuros que los ~20 que devuelve
         el endpoint, quedaría recortada a los primeros por kickoff */
      nextEvents.forEach((rawEvent) => {
        const round = String(rawEvent.intRound ?? "");
        if (round === currentRound) {
          addEvent(rawEvent, { onlyWithinWindow: false });
        } else if (followingRound && round === followingRound) {
          addEvent(rawEvent, { onlyWithinWindow: true });
        }
      });
    } else {
      const addRound = async (round, options) => {
        if (!round) return;
        const roundData = await fetchJson("eventsround.php", {
          id: leagueId,
          r: round,
          s: nextEvent.strSeason,
        });
        (roundData.events || []).forEach((rawEvent) =>
          addEvent(rawEvent, options),
        );
      };
      await addRound(currentRound, { onlyWithinWindow: false });
      await addRound(followingRound, { onlyWithinWindow: true });
    }

    return [...collected.values()].sort(
      (a, b) => new Date(a.kickoff) - new Date(b.kickoff),
    );
  });
};

export const getEventResult = async (providerEventId) => {
  const data = await fetchJson("lookupevent.php", { id: providerEventId });
  const event = (data.events || [])[0];
  if (!event) {
    throw new Error("El partido no existe en TheSportsDB");
  }
  return normalizeEvent(event);
};

/* ── Planteles (para el catálogo GDT — requiere key premium) ── */

/* La lista de un plantel incluye cuerpo técnico Y directivos: se filtran
   (President/CEO/Chairman/Owner detectados en el escaneo de ligas 2026-07-09) */
const STAFF_KEYWORDS = [
  "manager",
  "coach",
  "staff",
  "director",
  "physio",
  "president",
  "chairman",
  "owner",
  "ceo",
];

const isStaff = (rawPosition) => {
  const position = (rawPosition ?? "").toLowerCase();
  return STAFF_KEYWORDS.some((keyword) => position.includes(keyword));
};

/* Posición del proveedor → nuestras 4 (winger = DELANTERO, decisión del
   dueño). DICCIONARIO EXACTO como primera línea (pedido del dueño: mapeo
   predecible y auditable; construido escaneando el vocabulario completo de
   5 ligas, ~2.900 jugadores, 2026-07-09) + keywords como red de seguridad
   para variantes nuevas. Si nada matchea → null: el jugador se importa
   igual, sin posición, y el admin la completa. */
const POSITION_DICTIONARY = {
  goalkeeper: "ARQ",

  defender: "DEF",
  "centre-back": "DEF",
  "right-back": "DEF",
  "left-back": "DEF",
  "full-back": "DEF",
  "wing-back": "DEF",
  sweeper: "DEF",

  midfielder: "VOL",
  "central midfield": "VOL",
  "centre midfielder": "VOL",
  "defensive midfield": "VOL",
  "attacking midfield": "VOL",
  "left midfield": "VOL",
  "right midfield": "VOL",

  attacker: "DEL",
  forward: "DEL",
  "centre-forward": "DEL",
  striker: "DEL",
  "second striker": "DEL",
  winger: "DEL",
  "left wing": "DEL",
  "right wing": "DEL",
  "left winger": "DEL",
  "right winger": "DEL",
};

const mapPosition = (rawPosition) => {
  const position = (rawPosition ?? "").trim().toLowerCase();
  if (!position) return null;

  const exact = POSITION_DICTIONARY[position];
  if (exact) return exact;

  /* Red de seguridad por keywords para variantes fuera del diccionario.
     El orden importa: midfield antes que defen ("Defensive Midfield"),
     back/defen antes que wing ("Wing-Back"). */
  if (position.includes("goalkeeper") || position.includes("keeper"))
    return "ARQ";
  if (position.includes("midfield")) return "VOL";
  if (position.includes("back") || position.includes("defen")) return "DEF";
  if (
    position.includes("forward") ||
    position.includes("striker") ||
    position.includes("wing") ||
    position.includes("attack")
  )
    return "DEL";
  return null;
};

export const getLeagueTeams = async (leagueId) => {
  assertSupportedLeague(leagueId);

  /* lookup_all_teams da 404 con keys premium (endpoint legacy): se usa
     search_all_teams por NOMBRE oficial de liga, resuelto vía lookupleague
     para no duplicar nombres en la config */
  const leagueData = await fetchJson("lookupleague.php", { id: leagueId });
  const leagueName = (leagueData.leagues || [])[0]?.strLeague;
  if (!leagueName) {
    throw new Error("No se pudo resolver la liga en TheSportsDB");
  }

  const data = await fetchJson("search_all_teams.php", { l: leagueName });
  const teams = (data.teams || []).filter(
    (team) => String(team.idLeague) === String(leagueId),
  );
  if (teams.length === 0) {
    throw new Error(
      "No se pudieron listar los equipos de la liga (este endpoint requiere la key premium de TheSportsDB)",
    );
  }
  return teams.map((team) => ({
    providerTeamId: team.idTeam,
    name: team.strTeam,
    badgeUrl: team.strBadge ?? "",
  }));
};

export const getTeamPlayers = async (providerTeamId) => {
  const data = await fetchJson("lookup_all_players.php", {
    id: providerTeamId,
  });
  return (data.player || [])
    .filter((player) => player.strPlayer && !isStaff(player.strPosition))
    .map((player) => ({
      providerPlayerId: player.idPlayer,
      name: player.strPlayer.trim(),
      club: (player.strTeam ?? "").trim(),
      position: mapPosition(player.strPosition),
      positionRaw: player.strPosition ?? "",
      nationality: player.strNationality ?? "",
      photoUrl: player.strCutout || player.strThumb || "",
    }));
};
