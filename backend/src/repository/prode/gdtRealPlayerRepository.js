import GdtRealPlayer from "../../dao/models/prode/GdtRealPlayerModel.js";
import GdtUniverse from "../../dao/models/prode/GdtUniverseModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import { GDT_POSITIONS } from "../../dao/models/prode/prodeConstants.js";
import {
  getPoolLeagueTeams,
  getPoolTeamPlayers,
} from "../../integrations/sportsProvider/index.js";
import {
  squadOwnerId,
  latestSquadsByPlayer,
} from "./gdtSquadVersioning.js";
import ProdeTeamRepository from "./prodeTeamRepository.js";

/* Revisión post-edición del pool (transferencia de club, corrección de
   posición) sobre los planteles VIGENTES — detección automática en ambas
   direcciones para que el admin no revise plantel por plantel:
   · impacts: conflictos NUEVOS (→ considerar bloqueo puntual)
   · unblockSuggestions: slots BLOQUEADOS cuyo conflicto ya no existe
     (→ considerar desbloqueo). La decisión sigue siendo del admin. */
const computeEditReview = async (player) => {
  const empty = { impacts: [], unblockSuggestions: [] };
  const universe = await GdtUniverse.findById(player.gdtUniverse);
  if (!universe) return empty;
  const tournament = await ProdeTournament.findById(universe.tournament, {
    months: 1,
    participants: 1,
  }).populate("participants", "name");
  const months = tournament?.months ?? [];
  const nameById = new Map(
    (tournament?.participants ?? []).map((p) => [String(p._id), p.name]),
  );

  const squads = await GdtSquad.find({
    gdtUniverse: universe._id,
  }).populate("slots.realPlayer", "name club position");
  const normClub = (club) => (club ?? "").trim().toLowerCase();

  const impacts = [];
  const unblockSuggestions = [];
  for (const squad of latestSquadsByPlayer(squads, months).values()) {
    const owner = nameById.get(squadOwnerId(squad)) ?? "?";
    for (const slot of squad.slots ?? []) {
      const slotPlayer = slot.realPlayer;
      const positionMismatch =
        slotPlayer?.position && slot.position !== slotPlayer.position;
      const clubMate = (squad.slots ?? []).find(
        (other) =>
          other.slotNumber !== slot.slotNumber &&
          normClub(other.realPlayer?.club) === normClub(slotPlayer?.club),
      );

      /* Conflictos nuevos: solo sobre slots SIN bloquear que contengan al
         jugador editado */
      if (
        !slot.blocked &&
        String(slotPlayer?._id) === String(player._id)
      ) {
        if (positionMismatch) {
          impacts.push(
            `Plantel de ${owner}: ${player.name} ahora es ${player.position} pero ocupa un slot de ${slot.position}`,
          );
        }
        if (clubMate) {
          impacts.push(
            `Plantel de ${owner}: ${player.name} comparte club (${player.club}) con ${clubMate.realPlayer?.name}`,
          );
        }
      }

      /* Bloqueos que quedaron sin motivo: cualquier slot bloqueado del
         universo cuyo conflicto ya no existe */
      if (slot.blocked && !positionMismatch && !clubMate) {
        unblockSuggestions.push(
          `Plantel de ${owner}: ${slotPlayer?.name} sigue bloqueado pero ya no tiene conflicto — considerá desbloquearlo`,
        );
      }
    }
  }
  return { impacts, unblockSuggestions };
};

/* El pool es POR UNIVERSO (decisión canónica 2026-07-10): todo acá está
   scoped a un GdtUniverse. La liga del jugador es siempre la del universo. */

const validatePlayerFields = ({ name, club, position }) => {
  if (!name?.trim()) throw new Error("El nombre del jugador es obligatorio");
  if (!club?.trim()) throw new Error("El club es obligatorio");
  if (!GDT_POSITIONS.includes(position)) {
    throw new Error(
      "La posición debe ser Arquero, Defensor, Volante o Delantero",
    );
  }
};

const throwFriendlyDuplicate = (error) => {
  if (error?.code === 11000) {
    throw new Error(
      "Ese jugador ya existe en el pool de este universo GDT (mismo nombre y club)",
    );
  }
  throw error;
};

const getTeamOrThrow = async (universeId) => {
  const team = await GdtUniverse.findById(universeId);
  if (!team) throw new Error("Universo GDT no encontrado");
  return team;
};

/* --------------- DETECTOR DE TRANSFERENCIAS: helpers --------------- */

const normClubKey = (club) => (club ?? "").trim().toLowerCase();

/* Snapshot de los planteles vigentes de la liga según el provider, cacheado
   en memoria del server: re-correr el detector (o agregar un jugador nuevo
   desde el reporte) dentro de la ventana no vuelve a gastar cuota diaria. */
const SNAPSHOT_CACHE_TTL_MS = 30 * 60 * 1000;
const snapshotCache = new Map();

const fetchLeagueSnapshot = async (leagueProviderId) => {
  const hit = snapshotCache.get(String(leagueProviderId));
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const { teams: providerTeams, unresolvedTeams } =
    await getPoolLeagueTeams(leagueProviderId);
  const byProviderId = new Map();
  const failedTeams = [...unresolvedTeams];
  for (const providerTeam of providerTeams) {
    try {
      const players = await getPoolTeamPlayers(
        providerTeam.providerTeamId,
        providerTeam.name,
      );
      for (const player of players) {
        if (player.providerPlayerId) {
          byProviderId.set(player.providerPlayerId, player);
        }
      }
    } catch (error) {
      console.error(
        `Detector GDT: falló el plantel de ${providerTeam.name}:`,
        error.message,
      );
      failedTeams.push(providerTeam.name);
    }
  }

  /* Snapshot sin UN solo plantel = no hay nada que comparar (cuota diaria
     agotada, API caída). Se corta con error claro y NO se cachea: cachearlo
     dejaría al detector mostrando un reporte vacío mentiroso hasta el TTL. */
  if (byProviderId.size === 0) {
    throw new Error(
      "No se pudo consultar ningún plantel de la liga (probablemente se agotó la cuota diaria de API-Football): reintentá más tarde",
    );
  }

  const value = { byProviderId, failedTeams, fetchedAt: new Date() };
  snapshotCache.set(String(leagueProviderId), {
    value,
    expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
  });
  return value;
};

/* Quién tiene a cada jugador del pool en su plantel VIGENTE, con el slot
   exacto: ordena el reporte por urgencia (un cambio de club de un drafteado
   puede estar generando un conflicto 1-por-club ahora mismo) y habilita el
   bloqueo puntual desde el propio reporte, sin ir a buscar el plantel. */
const buildDraftedByMap = async (universe) => {
  const tournament = await ProdeTournament.findById(universe.tournament, {
    months: 1,
    participants: 1,
  }).populate("participants", "name");
  const months = tournament?.months ?? [];
  const nameById = new Map(
    (tournament?.participants ?? []).map((p) => [String(p._id), p.name]),
  );

  const squads = await GdtSquad.find({ gdtUniverse: universe._id });
  const draftedBy = new Map();
  for (const squad of latestSquadsByPlayer(squads, months).values()) {
    const ownerId = squadOwnerId(squad);
    const owner = nameById.get(ownerId) ?? "?";
    for (const slot of squad.slots ?? []) {
      if (!slot.realPlayer) continue;
      const key = String(slot.realPlayer);
      if (!draftedBy.has(key)) draftedBy.set(key, []);
      draftedBy.get(key).push({
        ownerId,
        name: owner,
        slotNumber: slot.slotNumber,
        position: slot.position,
        blocked: Boolean(slot.blocked),
      });
    }
  }
  return draftedBy;
};

export default class GdtRealPlayerRepository {
  /* --------------- GET POOL BY TEAM --------------- */
  /* club sigue siendo el nombre de la API (clave de la regla 1-por-club y de
     las comparaciones); clubDisplay y teamCode son la identidad EDITABLE que
     el admin define en Prode → Equipos, solo para mostrar. */
  getPlayersByTeam = async (universeId) => {
    const players = await GdtRealPlayer.find({ gdtUniverse: universeId })
      .sort({ club: 1, name: 1 })
      .lean();
    const teamMap = await new ProdeTeamRepository().getTeamMap();

    return players.map((player) => {
      const team = teamMap.get(`${player.league}|${player.club}`);
      return {
        ...player,
        clubDisplay: team?.displayName ?? player.club,
        teamCode: team?.code ?? "",
      };
    });
  };

  /* --------------- GET PLAYER BY ID --------------- */
  getGdtRealPlayerById = async (playerId) => {
    const player = await GdtRealPlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado en el pool");
    return player;
  };

  /* --------------- CREATE (alta manual del admin) --------------- */
  createGdtRealPlayer = async (universeId, { name, club, position }) => {
    const team = await getTeamOrThrow(universeId);
    validatePlayerFields({ name, club, position });

    try {
      return await GdtRealPlayer.create({
        gdtUniverse: team._id,
        name: name.trim(),
        club: club.trim(),
        position,
        league: team.league,
      });
    } catch (error) {
      throwFriendlyDuplicate(error);
    }
  };

  /* --------------- UPDATE --------------- */
  /* Transferencia a mitad de mes = EDITAR el club acá (nunca crear otro
     registro: la identidad sostiene planteles, quemas y reimports). Si la
     edición de club/posición genera inconsistencias en planteles vigentes,
     se devuelven como impacts para alertar al admin (→ bloqueo puntual). */
  updateGdtRealPlayer = async (playerId, { name, club, position }) => {
    const player = await GdtRealPlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado en el pool");

    const merged = {
      name: name ?? player.name,
      club: club ?? player.club,
      position: position ?? player.position,
    };
    validatePlayerFields(merged);

    const clubChanged = merged.club.trim() !== player.club;
    const positionChanged = merged.position !== player.position;

    player.name = merged.name.trim();
    player.club = merged.club.trim();
    player.position = merged.position;

    let playerUpdated;
    try {
      playerUpdated = await player.save();
    } catch (error) {
      throwFriendlyDuplicate(error);
    }

    const { impacts, unblockSuggestions } =
      clubChanged || positionChanged
        ? await computeEditReview(playerUpdated)
        : { impacts: [], unblockSuggestions: [] };

    return { playerUpdated, impacts, unblockSuggestions };
  };

  /* --------------- DELETE --------------- */
  deleteGdtRealPlayer = async (playerId) => {
    const inSquad = await GdtSquad.exists({ "slots.realPlayer": playerId });
    if (inSquad) {
      throw new Error(
        "No se puede eliminar: el jugador está en al menos un plantel GDT",
      );
    }

    const deleted = await GdtRealPlayer.findByIdAndDelete(playerId);
    if (!deleted) throw new Error("Jugador no encontrado en el pool");
    return deleted;
  };

  /* --------------- SUPER DELETE GDT REAL PLAYER --------------- */
  /* SOLO super admin (middleware): borra al jugador real aunque esté en
     planteles — se lo saca de todos los slots (esos slots quedan vacíos y
     suman 0), de los reemplazos pendientes, de los quemados del universo y
     de los puntajes de fecha cargados. */
  superDeleteGdtRealPlayer = async (playerId) => {
    await GdtSquad.updateMany(
      {},
      {
        $pull: {
          slots: { realPlayer: playerId },
          pendingReplacements: { realPlayer: playerId },
        },
      },
    );
    await GdtUniverse.updateMany(
      { burned: playerId },
      { $pull: { burned: playerId } },
    );
    await ProdeMatchday.updateMany(
      { "gdtScores.realPlayer": playerId },
      { $pull: { gdtScores: { realPlayer: playerId } } },
    );

    const deleted = await GdtRealPlayer.findByIdAndDelete(playerId);
    if (!deleted) throw new Error("Jugador no encontrado en el pool");
    return deleted;
  };

  /* --------------- IMPORT POOL FROM PROVIDER --------------- */
  /* Trae la foto fresca de la liga del universo. SOLO CREA lo que falta en
     este pool (idempotente y aditivo: re-importar tras un mercado de pases
     suma refuerzos sin pisar ediciones del admin). Los jugadores sin
     posición mapeable se informan para alta manual. */
  importPoolFromProvider = async (universeId) => {
    const team = await getTeamOrThrow(universeId);
    if (!team.leagueProviderId) {
      throw new Error(
        "El universo GDT no tiene liga del catálogo asociada: no se puede importar",
      );
    }

    /* Lista de equipos vigentes + IDs resueltos en API-Football (los
       planteles vienen de ahí — plan híbrido); los equipos que no se
       pudieron resolver se informan como fallidos */
    const { teams: providerTeams, unresolvedTeams } = await getPoolLeagueTeams(
      team.leagueProviderId,
    );
    const summary = {
      league: team.league,
      teams: providerTeams.length,
      created: 0,
      alreadyExisting: 0,
      withoutPosition: [],
      failedTeams: [...unresolvedTeams],
    };

    for (const providerTeam of providerTeams) {
      let players;
      try {
        players = await getPoolTeamPlayers(
          providerTeam.providerTeamId,
          providerTeam.name,
        );
      } catch (error) {
        console.error(
          `Import GDT: falló el plantel de ${providerTeam.name}:`,
          error.message,
        );
        summary.failedTeams.push(providerTeam.name);
        continue;
      }

      for (const player of players) {
        const club = player.club || providerTeam.name;

        /* providerPlayerId null jamás entra al $or: matchearía altas manuales */
        const matchers = [{ gdtUniverse: team._id, name: player.name, club }];
        if (player.providerPlayerId) {
          matchers.push({
            gdtUniverse: team._id,
            providerPlayerId: player.providerPlayerId,
          });
        }
        const exists = await GdtRealPlayer.exists({ $or: matchers });
        if (exists) {
          summary.alreadyExisting += 1;
          continue;
        }

        /* Posición no mapeable → se importa IGUAL con posición null (nunca
           se descarta un jugador); el admin la completa desde el pool */
        if (!player.position) {
          summary.withoutPosition.push(
            `${player.name} (${club}${player.positionRaw ? ` · ${player.positionRaw}` : ""})`,
          );
        }

        await GdtRealPlayer.create({
          gdtUniverse: team._id,
          name: player.name,
          club,
          position: player.position ?? null,
          league: team.league,
          providerPlayerId: player.providerPlayerId,
          nationality: player.nationality,
          photoUrl: player.photoUrl,
        });
        summary.created += 1;
      }
    }

    return summary;
  };

  /* --------------- TRANSFER REPORT --------------- */
  /* SOLO LEE Y COMPARA el pool contra los planteles vigentes de la liga:
     el import es solo-crea y los clubes quedan congelados tras la carga
     inicial — este reporte es la capa de detección de transferencias.
     Escribir es siempre una acción manual del admin, fila por fila. */
  getTransferReport = async (universeId) => {
    const team = await getTeamOrThrow(universeId);
    if (!team.leagueProviderId) {
      throw new Error(
        "El universo GDT no tiene liga del catálogo asociada: no se puede detectar transferencias",
      );
    }

    const poolPlayers = await GdtRealPlayer.find({ gdtUniverse: team._id });
    if (poolPlayers.length === 0) {
      throw new Error(
        "El pool está vacío: primero importá los planteles de la liga",
      );
    }

    const snapshot = await fetchLeagueSnapshot(team.leagueProviderId);
    const draftedBy = await buildDraftedByMap(team);

    /* Un equipo que falló en el snapshot no prueba ausencia: sus jugadores
       no pueden reportarse como "fuera de la liga" */
    const failedClubKeys = new Set(snapshot.failedTeams.map(normClubKey));

    /* Limpieza perezosa de silenciados: si la API ya no dice ese club para
       el jugador, la entrada cumplió su ciclo */
    const poolById = new Map(poolPlayers.map((p) => [String(p._id), p]));
    const ignores = team.transferIgnores ?? [];
    const validIgnores = ignores.filter((entry) => {
      const poolPlayer = poolById.get(String(entry.realPlayer));
      if (!poolPlayer?.providerPlayerId) return false;
      const snapPlayer = snapshot.byProviderId.get(poolPlayer.providerPlayerId);
      return (
        snapPlayer &&
        normClubKey(snapPlayer.club) === normClubKey(entry.apiClub)
      );
    });
    if (validIgnores.length !== ignores.length) {
      team.transferIgnores = validIgnores;
      await team.save();
    }
    const ignoredPlayerIds = new Set(
      validIgnores.map((entry) => String(entry.realPlayer)),
    );

    const clubChanged = [];
    const missingFromLeague = [];
    const knownProviderIds = new Set();

    for (const player of poolPlayers) {
      /* Altas manuales (sin providerPlayerId): fuera del detector, no hay
         cómo matchearlas confiablemente contra la API */
      if (!player.providerPlayerId) continue;
      knownProviderIds.add(player.providerPlayerId);

      const snapPlayer = snapshot.byProviderId.get(player.providerPlayerId);
      const row = {
        playerId: player._id,
        name: player.name,
        photoUrl: player.photoUrl,
        position: player.position,
        currentClub: player.club,
        /* [{ownerId, name, slotNumber, position, blocked}]: el slot viaja
           para poder bloquear desde el reporte */
        draftedBy: draftedBy.get(String(player._id)) ?? [],
      };

      if (!snapPlayer) {
        if (!failedClubKeys.has(normClubKey(player.club))) {
          missingFromLeague.push(row);
        }
        continue;
      }
      if (
        normClubKey(snapPlayer.club) !== normClubKey(player.club) &&
        !ignoredPlayerIds.has(String(player._id))
      ) {
        clubChanged.push({ ...row, apiClub: snapPlayer.club });
      }
    }

    /* Jugadores de la API que no están en el pool (refuerzos del mercado):
       se listan para agregarlos selectivamente desde el reporte */
    const newPlayers = [];
    for (const [providerPlayerId, snapPlayer] of snapshot.byProviderId) {
      if (knownProviderIds.has(providerPlayerId)) continue;
      newPlayers.push({
        providerPlayerId,
        name: snapPlayer.name,
        club: snapPlayer.club,
        position: snapPlayer.position ?? null,
        photoUrl: snapPlayer.photoUrl,
      });
    }

    const byDraftedThenName = (a, b) =>
      (b.draftedBy.length > 0) - (a.draftedBy.length > 0) ||
      a.name.localeCompare(b.name, "es");
    clubChanged.sort(byDraftedThenName);
    missingFromLeague.sort(byDraftedThenName);
    newPlayers.sort(
      (a, b) =>
        a.club.localeCompare(b.club, "es") ||
        a.name.localeCompare(b.name, "es"),
    );

    return {
      league: team.league,
      fetchedAt: snapshot.fetchedAt,
      failedTeams: snapshot.failedTeams,
      ignoredCount: validIgnores.length,
      clubChanged,
      missingFromLeague,
      newPlayers,
    };
  };

  /* --------------- TRANSFER IGNORE --------------- */
  /* Silencia el par (jugador, club según la API): el caso "el admin le ganó
     a la API" — editó el club antes de que la API actualice y el diff
     aparecería al revés sugiriendo revertir la corrección */
  ignoreTransfer = async (universeId, { playerId, apiClub }) => {
    const team = await getTeamOrThrow(universeId);
    if (!playerId) throw new Error("Falta el jugador a silenciar");
    if (!apiClub?.trim()) throw new Error("Falta el club según la API");

    const player = await GdtRealPlayer.findOne({
      _id: playerId,
      gdtUniverse: team._id,
    });
    if (!player) {
      throw new Error("Jugador no encontrado en el pool de este universo");
    }

    const alreadyIgnored = (team.transferIgnores ?? []).some(
      (entry) => String(entry.realPlayer) === String(player._id),
    );
    if (!alreadyIgnored) {
      team.transferIgnores.push({
        realPlayer: player._id,
        apiClub: apiClub.trim(),
      });
      await team.save();
    }
    return { playerName: player.name };
  };

  /* --------------- TRANSFER ADD PLAYERS --------------- */
  /* Alta selectiva de jugadores nuevos detectados por el reporte: una fila
     sola o todo un club de una (el reporte ABSORBIÓ al reimport masivo, así
     que el club entero tiene que poder entrar con un clic). El server no
     confía en el navegador: los datos salen del snapshot cacheado, el body
     solo trae providerPlayerIds (mismo patrón que el carrito).
     Una fila que falla NO cancela el resto: se informa en skipped. */
  addTransferPlayers = async (universeId, { providerPlayerIds }) => {
    const team = await getTeamOrThrow(universeId);
    if (!team.leagueProviderId) {
      throw new Error(
        "El universo GDT no tiene liga del catálogo asociada: no se puede agregar desde el reporte",
      );
    }
    const ids = [
      ...new Set((providerPlayerIds ?? []).map(String).filter(Boolean)),
    ];
    if (ids.length === 0) throw new Error("Faltan los jugadores a agregar");

    const snapshot = await fetchLeagueSnapshot(team.leagueProviderId);
    const summary = { created: [], skipped: [], withoutPosition: [] };

    for (const providerPlayerId of ids) {
      const snapPlayer = snapshot.byProviderId.get(providerPlayerId);
      if (!snapPlayer) {
        summary.skipped.push(
          "Un jugador ya no figura en el snapshot de la liga: volvé a detectar diferencias",
        );
        continue;
      }

      const exists = await GdtRealPlayer.exists({
        gdtUniverse: team._id,
        providerPlayerId,
      });
      if (exists) {
        summary.skipped.push(`${snapPlayer.name}: ya estaba en el pool`);
        continue;
      }

      try {
        const created = await GdtRealPlayer.create({
          gdtUniverse: team._id,
          name: snapPlayer.name,
          club: snapPlayer.club,
          position: snapPlayer.position ?? null,
          league: team.league,
          providerPlayerId,
          nationality: snapPlayer.nationality,
          photoUrl: snapPlayer.photoUrl,
        });
        summary.created.push({ name: created.name, club: created.club });
        if (!created.position) summary.withoutPosition.push(created.name);
      } catch (error) {
        /* Homónimo en el mismo club ya cargado a mano: se saltea */
        if (error?.code === 11000) {
          summary.skipped.push(
            `${snapPlayer.name}: ya existe en el pool (mismo nombre y club)`,
          );
          continue;
        }
        throw error;
      }
    }

    return summary;
  };
}
