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

/* --------------- LISTA DE EQUIPOS DEL POOL --------------- */
/* Devuelve { teams: [{ providerTeamId, name }], unresolvedTeams: [names] }.
   providerTeamId = ID de API-Football; name = nombre según API-Football
   (fuente única del club → sin duplicados con/sin tilde). */
export const getPoolLeagueTeams = async (theSportsDbLeagueId) => {
  const cached = resolutionCache.get(String(theSportsDbLeagueId));
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const leagueConfig = getLeagueConfigOrThrow(theSportsDbLeagueId);

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
    const value = { teams, unresolvedTeams: [] };
    resolutionCache.set(String(theSportsDbLeagueId), {
      value,
      expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
    });
    return value;
  }

  /* ① Equipos VIGENTES de la liga según TheSportsDB, deduplicados por
     nombre normalizado (sus duplicados con/sin tilde colapsan acá; se
     conserva la variante acentuada, que es la que se muestra como club) */
  const currentTeams = await getLeagueTeams(theSportsDbLeagueId);
  const currentNames = new Map();
  for (const team of currentTeams) {
    const key = normalizeName(team.name);
    if (!key) continue;
    const existing = currentNames.get(key);
    if (!existing || accentCount(team.name) > accentCount(existing)) {
      currentNames.set(key, team.name);
    }
  }

  /* ② Listado base de la liga en API-Football (temporada accesible del
     plan) — resuelve la mayoría de los IDs en UNA request */
  const baseData = await fetchJson("/teams", {
    league: leagueConfig.id,
    season: teamListSeason(),
  });
  const baseByName = new Map();
  for (const item of baseData.response ?? []) {
    baseByName.set(normalizeName(item.team.name), String(item.team.id));
  }

  /* El nombre visible del club es SIEMPRE el de TheSportsDB (acentuado,
     igual al de los partidos del prode); API-Football solo aporta el ID */
  const resolved = new Map();
  const addResolved = (providerTeamId, displayName) =>
    resolved.set(String(providerTeamId), {
      providerTeamId: String(providerTeamId),
      name: displayName,
    });

  const tokensOfName = (name) => new Set(normalizeName(name).split(" "));
  const isSubset = (small, big) =>
    [...small].every((token) => big.has(token));

  /* Un nombre corto ("Belgrano", "Unión") se resuelve contra la PROPIA
     liga: si contiene o está contenido en exactamente UN equipo del
     listado base, es ese — sin requests extra ni adivinanzas */
  const findUniqueBaseMatch = (key) => {
    const keyTokens = new Set(key.split(" "));
    const matches = [];
    for (const [baseKey, baseId] of baseByName) {
      const baseTokens = new Set(baseKey.split(" "));
      if (isSubset(keyTokens, baseTokens) || isSubset(baseTokens, keyTokens)) {
        matches.push(baseId);
      }
    }
    return matches.length === 1 ? matches[0] : null;
  };

  const pendingSearch = [];
  for (const [key, originalName] of currentNames) {
    /* Alias curados para nombres que difieren demasiado entre proveedores */
    if (API_FOOTBALL_TEAM_ALIASES[key]) {
      addResolved(API_FOOTBALL_TEAM_ALIASES[key], originalName);
      continue;
    }
    if (baseByName.has(key)) {
      addResolved(baseByName.get(key), originalName);
      continue;
    }
    const uniqueBaseMatch = findUniqueBaseMatch(key);
    if (uniqueBaseMatch) {
      addResolved(uniqueBaseMatch, originalName);
      continue;
    }
    pendingSearch.push(originalName);
  }

  /* ③ Los que faltan (ascendidos posteriores a la temporada base, nombres
     nuevos, o entradas DUPLICADAS de TheSportsDB tipo "Belgrano" +
     "Belgrano Córdoba") se buscan uno a uno. Si la búsqueda devuelve un
     equipo YA resuelto cuyo nombre contiene al pendiente, es una variante
     duplicada y se fusiona en silencio. Ante ambigüedad real NO se adivina:
     se reporta sin resolver y la solución es un alias en la config. */
  const unresolvedTeams = [];
  for (const name of pendingSearch) {
    let candidates = [];
    try {
      const searchData = await fetchJson("/teams", {
        search: normalizeName(name),
      });
      candidates = (searchData.response ?? []).filter(
        (item) =>
          item.team.country === leagueConfig.country &&
          !isYouthOrReserveTeam(item.team.name),
      );
    } catch (error) {
      console.error(
        `API-Football: falló la búsqueda de "${name}":`,
        error.message,
      );
    }

    const pendingTokens = tokensOfName(name);
    const duplicateOfResolved = candidates.some((item) => {
      const resolvedEntry = resolved.get(String(item.team.id));
      return (
        resolvedEntry &&
        (isSubset(pendingTokens, tokensOfName(resolvedEntry.name)) ||
          isSubset(pendingTokens, tokensOfName(item.team.name)))
      );
    });
    if (duplicateOfResolved) continue;

    const newCandidates = candidates.filter(
      (item) => !resolved.has(String(item.team.id)),
    );
    /* Desempate por nombre EXACTO (normalizado): ante homónimos del mismo
       país ("Santos" / "Santos AP", "Coritiba" / "Coritiba SE") gana el
       que se llama igual, solo si es uno. Si no, sigue sin adivinarse. */
    const exactMatches = newCandidates.filter(
      (item) => normalizeName(item.team.name) === normalizeName(name),
    );
    if (newCandidates.length === 1) {
      addResolved(newCandidates[0].team.id, name);
    } else if (exactMatches.length === 1) {
      addResolved(exactMatches[0].team.id, name);
    } else {
      unresolvedTeams.push(name);
    }
  }

  const value = { teams: [...resolved.values()], unresolvedTeams };
  resolutionCache.set(String(theSportsDbLeagueId), {
    value,
    expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
  });
  return value;
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
