import {
  API_FOOTBALL_KEY,
  API_FOOTBALL_BASE_URL,
  API_FOOTBALL_LEAGUES,
  API_FOOTBALL_TEAM_ALIASES,
  teamListSeason,
} from "../../config/sportsProvider/apiFootballConfig.js";
import { getLeagueTeams } from "./theSportsDbAdapter.js";

/* Adapter de PLANTELES sobre API-Football. La lista de equipos vigentes de
   la liga sale de TheSportsDB (sus fixtures/equipos por liga están bien; lo
   roto son sus planteles) y cada equipo se resuelve a su ID de API-Football
   — por listado de temporada base + búsqueda individual para el resto. */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Rate limit adaptativo: el plan free permite pocas requests por minuto.
   Se lee el header de cuota restante y, si se agotó el minuto, se espera.
   El límite DIARIO agotado corta con error claro (no tiene sentido esperar). */
let minuteRemaining = null;

/* Cuota DIARIA según los headers de la última respuesta válida: el modal
   de selección de equipos la muestra para que el admin calcule el gasto
   antes de importar o detectar. null = todavía no se consultó la API. */
let dailyQuota = { remaining: null, limit: null, checkedAt: null };

export const getPoolQuota = () => ({ ...dailyQuota });

/* Error marcado: los loops de planteles cortan acá en vez de seguir
   gastando requests que van a fallar igual */
const dailyQuotaError = () => {
  const error = new Error(
    "Se agotaron las requests diarias del plan de API-Football: reintentá mañana",
  );
  error.code = "DAILY_QUOTA";
  return error;
};

export const isDailyQuotaError = (error) => error?.code === "DAILY_QUOTA";

const fetchJson = async (endpoint, params = {}, isRetry = false) => {
  if (!API_FOOTBALL_KEY) {
    throw new Error(
      "Falta API_FOOTBALL_KEY en el .env: es la fuente de los planteles",
    );
  }

  if (minuteRemaining === 0) {
    await sleep(61000);
  }

  const url = new URL(`${API_FOOTBALL_BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  );

  const response = await fetch(url, {
    headers: { "x-apisports-key": API_FOOTBALL_KEY },
  });

  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  minuteRemaining =
    remainingHeader === null ? null : Number(remainingHeader);

  /* Las respuestas de error no traen los headers de cuota: se conserva el
     último valor conocido */
  const dailyRemainingHeader = response.headers.get(
    "x-ratelimit-requests-remaining",
  );
  if (dailyRemainingHeader !== null) {
    const dailyLimitHeader = response.headers.get("x-ratelimit-requests-limit");
    dailyQuota = {
      remaining: Number(dailyRemainingHeader),
      limit: dailyLimitHeader === null ? null : Number(dailyLimitHeader),
      checkedAt: new Date(),
    };
  }

  if (response.status === 429) {
    if (isRetry) {
      throw new Error("API-Football rechazó por rate limit dos veces seguidas");
    }
    minuteRemaining = 0;
    return fetchJson(endpoint, params, true);
  }
  if (!response.ok) {
    throw new Error(`API-Football respondió ${response.status} en ${endpoint}`);
  }

  const data = await response.json();

  /* La API devuelve 200 con un objeto errors cuando algo falló */
  const errors = data?.errors;
  if (errors && !Array.isArray(errors) && Object.keys(errors).length > 0) {
    if (errors.requests) {
      dailyQuota = { ...dailyQuota, remaining: 0, checkedAt: new Date() };
      throw dailyQuotaError();
    }
    if (errors.rateLimit && !isRetry) {
      minuteRemaining = 0;
      return fetchJson(endpoint, params, true);
    }
    throw new Error(
      `API-Football devolvió un error: ${Object.values(errors).join(" · ")}`,
    );
  }

  await sleep(300);
  return data;
};

const normalizeName = (name) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    /* Los apóstrofes se ELIMINAN (no se vuelven espacio): "Newell's" y
       "Newells" deben normalizar igual */
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* Cuenta tildes/diacríticos: ante nombres duplicados en TheSportsDB
   ("Atletico Tucuman" / "Atlético Tucumán") se prefiere el acentuado */
const accentCount = (name) =>
  (name ?? "").normalize("NFD").match(/\p{Diacritic}/gu)?.length ?? 0;

/* Equipos filiales que la búsqueda puede devolver junto al principal:
   juveniles, reserva, femeninos ("Santos W") y segundos equipos
   ("Mirassol B") — verificado contra el Brasileirão 2026-11-09, donde un
   femenino se colaba como única coincidencia de Athletico Paranaense */
const isYouthOrReserveTeam = (name) =>
  /\bu-?\d{2}\b|\bres\.?$|\breserves?\b|\bfem|\s(w|b)$/i.test(
    (name ?? "").trim(),
  );

/* Posiciones de API-Football: 4 categorías limpias, mapeo 1 a 1 */
const POSITION_MAP = {
  goalkeeper: "ARQ",
  defender: "DEF",
  midfielder: "VOL",
  attacker: "DEL",
};

const getLeagueConfigOrThrow = (theSportsDbLeagueId) => {
  const config = API_FOOTBALL_LEAGUES[String(theSportsDbLeagueId)];
  if (!config) {
    throw new Error(
      "Esta liga no soporta el import de planteles (no está mapeada en API-Football)",
    );
  }
  return config;
};

/* Cache corto de la resolución de equipos: un reintento del import no
   vuelve a gastar cuota en resolver lo mismo */
const resolutionCache = new Map();
const RESOLUTION_CACHE_TTL_MS = 10 * 60 * 1000;

/* Listado de una competición de selecciones. Las que van por CICLO
   (eliminatorias: temporadas 2018, 2020, 2024…) no tienen temporada para
   cada año: si la temporada base no existe (o el plan no la ve), se usa
   la última de la competición anterior a la base. */
const fetchNationalTeamList = async (apiFootballLeagueId) => {
  const baseSeason = teamListSeason();
  const listSeason = async (season) =>
    (
      await fetchJson("/teams", { league: apiFootballLeagueId, season })
    ).response ?? [];

  try {
    const items = await listSeason(baseSeason);
    if (items.length > 0) return items;
  } catch (error) {
    if (isDailyQuotaError(error)) throw error;
  }

  const leagueData = await fetchJson("/leagues", { id: apiFootballLeagueId });
  const previousSeasons = (leagueData.response?.[0]?.seasons ?? [])
    .map((season) => season.year)
    .filter((year) => year < baseSeason)
    .sort((a, b) => b - a);
  if (previousSeasons.length === 0) return [];
  return listSeason(previousSeasons[0]);
};

/* Listado de una división inferior en la temporada base. Es de una
   temporada TERMINADA (no cambia): se cachea un día para que reabrir el
   modal o reintentar un import no vuelva a gastar cuota. */
const divisionListCache = new Map();
const DIVISION_LIST_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const fetchDivisionTeams = async (apiFootballLeagueId) => {
  const season = teamListSeason();
  const cacheKey = `${apiFootballLeagueId}:${season}`;
  const cached = divisionListCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.items;

  const data = await fetchJson("/teams", {
    league: apiFootballLeagueId,
    season,
  });
  const items = data.response ?? [];
  divisionListCache.set(cacheKey, {
    items,
    expiresAt: Date.now() + DIVISION_LIST_CACHE_TTL_MS,
  });
  return items;
};

/* --------------- LISTA DE EQUIPOS DEL POOL --------------- */

const tokensOfName = (name) => new Set(normalizeName(name).split(" "));
const isSubset = (small, big) => [...small].every((token) => big.has(token));
/* Un nombre contiene al otro palabra por palabra, en cualquier dirección:
   "Leeds" ↔ "Leeds United", "Brighton" ↔ "Brighton and Hove Albion" */
const namesOverlap = (nameA, nameB) => {
  const tokensA = tokensOfName(nameA);
  const tokensB = tokensOfName(nameB);
  return isSubset(tokensA, tokensB) || isSubset(tokensB, tokensA);
};

/* Parecido para ORDENAR sugerencias (no para decidir): proporción de
   palabras compartidas sobre el nombre más largo */
const similarity = (nameA, nameB) => {
  const tokensA = tokensOfName(nameA);
  const tokensB = tokensOfName(nameB);
  const shared = [...tokensA].filter((token) => tokensB.has(token)).length;
  return shared / Math.max(tokensA.size, tokensB.size, 1);
};

const MAX_SUGGESTIONS = 5;

/* Devuelve:
   · teams: [{ providerTeamId, name }] — providerTeamId = ID API-Football;
     name = nombre TheSportsDB (acentuado, igual al de los partidos del
     prode): API-Football solo aporta el ID.
   · unresolvedTeams: [names] — los que no se pudieron decidir.
   · unresolvedDetails: [{ sourceTeamId, name, suggestions }] — lo mismo
     con candidatos ordenados por parecido, para que el admin los vincule.

   links: vínculos manuales guardados por el admin para esta liga
   ([{ sourceTeamId, providerTeamId }]), con prioridad sobre todo lo demás.

   Un solo camino de decisión, estricto: ante la duda NO se adivina, el
   equipo queda para que lo vincule el admin. */
export const getPoolLeagueTeams = async (theSportsDbLeagueId, links = []) => {
  /* La clave incluye los vínculos: guardar uno nuevo invalida solo */
  const cacheKey = [
    String(theSportsDbLeagueId),
    ...links.map((link) => `${link.sourceTeamId}:${link.providerTeamId}`).sort(),
  ].join("|");
  const cached = resolutionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const leagueConfig = getLeagueConfigOrThrow(theSportsDbLeagueId);
  const cacheAndReturn = (value) => {
    resolutionCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
    });
    return value;
  };

  /* Selecciones: la lista sale directo del listado de API-Football (una
     request). No hay ascensos ni descensos que cruzar con TheSportsDB, y
     su filtro por país no aplica (el país de una selección es ella misma) */
  if (leagueConfig.national) {
    const nationalTeams = await fetchNationalTeamList(leagueConfig.id);
    const teams = nationalTeams
      .filter((item) => item.team.national)
      .map((item) => ({
        providerTeamId: String(item.team.id),
        name: item.team.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
    return cacheAndReturn({ teams, unresolvedTeams: [], unresolvedDetails: [] });
  }

  /* ① Equipos VIGENTES de la liga según TheSportsDB, deduplicados por
     nombre normalizado (sus duplicados con/sin tilde colapsan acá; se
     conserva la variante acentuada, que es la que se muestra como club) */
  const currentTeams = await getLeagueTeams(theSportsDbLeagueId);
  const sourceByKey = new Map();
  for (const team of currentTeams) {
    const key = normalizeName(team.name);
    if (!key) continue;
    const existing = sourceByKey.get(key);
    if (!existing || accentCount(team.name) > accentCount(existing.name)) {
      sourceByKey.set(key, {
        sourceTeamId: String(team.providerTeamId),
        name: team.name,
      });
    }
  }

  const resolved = new Map();
  const addResolved = (providerTeamId, displayName) =>
    resolved.set(String(providerTeamId), {
      providerTeamId: String(providerTeamId),
      name: displayName,
    });

  /* ② Vínculos manuales del admin y alias curados de la config */
  const linkBySource = new Map(
    links.map((link) => [String(link.sourceTeamId), String(link.providerTeamId)]),
  );
  let pending = [];
  for (const [key, source] of sourceByKey) {
    const linkedId =
      linkBySource.get(source.sourceTeamId) ?? API_FOOTBALL_TEAM_ALIASES[key];
    if (linkedId) {
      addResolved(linkedId, source.name);
    } else {
      pending.push(source);
    }
  }

  /* ③ Match por DIVISIÓN, de arriba hacia abajo: 1ª de la temporada base y,
     solo si quedan pendientes, 2ª y 3ª (los ascendidos — ver lowerDivisions
     en la config). Una request por división, cacheada un día. En cada una:
     nombre exacto, o si no, UN ÚNICO club que coincida palabra por palabra.
     Si el club ya estaba resuelto con otro nombre que se le parece, es una
     entrada duplicada de TheSportsDB ("Belgrano" / "Belgrano Córdoba") y
     se fusiona. Cualquier otra duda queda para el admin. */
  const divisionIds = [leagueConfig.id, ...(leagueConfig.lowerDivisions ?? [])];
  const candidatePool = [];
  for (const [index, divisionId] of divisionIds.entries()) {
    if (pending.length === 0) break;

    let items;
    try {
      items = (await fetchDivisionTeams(divisionId)).filter(
        (item) => !isYouthOrReserveTeam(item.team.name),
      );
    } catch (error) {
      /* Sin el listado de 1ª no hay resolución posible: el error sube */
      if (index === 0 || isDailyQuotaError(error)) throw error;
      console.error(
        `API-Football: falló el listado de la división ${divisionId}:`,
        error.message,
      );
      continue;
    }
    const tier = index === 0 ? 1 : index === 1 ? 2 : 3;
    for (const item of items) candidatePool.push({ item, tier });

    const nextPending = [];
    for (const source of pending) {
      const key = normalizeName(source.name);
      const exact = items.filter((item) => normalizeName(item.team.name) === key);
      const byTokens = items.filter((item) => namesOverlap(source.name, item.team.name));
      const match =
        exact.length === 1 ? exact[0] : byTokens.length === 1 ? byTokens[0] : null;

      if (!match) {
        nextPending.push(source);
        continue;
      }
      const matchId = String(match.team.id);
      const existing = resolved.get(matchId);
      if (existing) {
        if (!namesOverlap(source.name, existing.name)) nextPending.push(source);
        continue;
      }
      addResolved(matchId, source.name);
    }
    pending = nextPending;
  }

  /* ④ Lo que queda va al admin, con sugerencias de los mismos listados ya
     descargados (cero requests extra): primero el más parecido y, a igual
     parecido, el de la división más alta */
  const unresolvedDetails = pending.map((source) => {
    const seen = new Set();
    const suggestions = candidatePool
      .filter(({ item }) => {
        const id = String(item.team.id);
        if (resolved.has(id) || seen.has(id)) return false;
        seen.add(id);
        return similarity(source.name, item.team.name) > 0;
      })
      .map(({ item, tier }) => ({
        providerTeamId: String(item.team.id),
        name: item.team.name,
        tier,
        score: similarity(source.name, item.team.name),
      }))
      .sort((a, b) => b.score - a.score || a.tier - b.tier)
      .slice(0, MAX_SUGGESTIONS)
      .map(({ score, ...suggestion }) => suggestion);
    return { sourceTeamId: source.sourceTeamId, name: source.name, suggestions };
  });

  return cacheAndReturn({
    teams: [...resolved.values()],
    unresolvedTeams: unresolvedDetails.map((detail) => detail.name),
    unresolvedDetails,
  });
};

/* --------------- BÚSQUEDA MANUAL DE EQUIPO --------------- */
/* Para el admin, cuando el club correcto no está entre las sugerencias.
   UNA request, solo a pedido. La búsqueda de API-Football compara por
   substring: conviene el nombre corto ("Leeds", no "Leeds United"). Se
   filtra por el país de la liga y sin juveniles ni filiales. */
export const searchPoolTeams = async (theSportsDbLeagueId, term) => {
  const leagueConfig = getLeagueConfigOrThrow(theSportsDbLeagueId);
  const query = normalizeName(term);
  if (query.length < 3) {
    throw new Error("Escribí al menos 3 letras para buscar");
  }
  const data = await fetchJson("/teams", { search: query });
  return (data.response ?? [])
    .filter(
      (item) =>
        (!leagueConfig.country || item.team.country === leagueConfig.country) &&
        !isYouthOrReserveTeam(item.team.name),
    )
    .map((item) => ({
      providerTeamId: String(item.team.id),
      name: item.team.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
};

/* --------------- PLANTEL DE UN EQUIPO --------------- */
/* El plantel VIGENTE (el endpoint no distingue temporadas y el plan free lo
   sirve completo — verificado 2026-07-09). club = nombre API-Football del
   equipo, para que la regla 1-por-club compare siempre contra lo mismo. */
export const getPoolTeamPlayers = async (providerTeamId, teamName) => {
  const data = await fetchJson("/players/squads", { team: providerTeamId });
  const squad = (data.response ?? [])[0];
  const players = squad?.players ?? [];
  if (players.length === 0) {
    throw new Error(`API-Football no tiene plantel cargado para ${teamName}`);
  }

  return players
    .filter((player) => player.name)
    .map((player) => ({
      providerPlayerId: player.id ? String(player.id) : null,
      name: player.name.trim(),
      club: teamName,
      position: POSITION_MAP[(player.position ?? "").toLowerCase()] ?? null,
      positionRaw: player.position ?? "",
      nationality: "",
      photoUrl: player.photo ?? "",
    }));
};
