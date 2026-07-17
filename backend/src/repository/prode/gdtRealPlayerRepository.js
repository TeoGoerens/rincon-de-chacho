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

export default class GdtRealPlayerRepository {
  /* --------------- GET POOL BY TEAM --------------- */
  getPlayersByTeam = async (universeId) =>
    GdtRealPlayer.find({ gdtUniverse: universeId }).sort({ club: 1, name: 1 });

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
}
