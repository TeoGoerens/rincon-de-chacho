import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import GdtUniverse from "../../dao/models/prode/GdtUniverseModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import GdtRealPlayer from "../../dao/models/prode/GdtRealPlayerModel.js";
import ProdeStatsRepository from "./prodeStatsRepository.js";

const statsRepository = new ProdeStatsRepository();

/* Los duelos de cada fecha emparejan a TODOS los participantes (duelos =
   participantes / 2), por eso la lista debe tener cantidad par. */
const validateParticipants = async (participants) => {
  const unique = new Set(participants.map(String));
  if (unique.size !== participants.length) {
    throw new Error("La lista de participantes tiene jugadores repetidos");
  }
  if (participants.length % 2 !== 0) {
    throw new Error(
      "La cantidad de participantes debe ser par (los duelos son 1 vs 1)",
    );
  }
  const found = await ProdePlayer.countDocuments({
    _id: { $in: participants },
  });
  if (found !== participants.length) {
    throw new Error("Alguno de los participantes no existe como jugador");
  }
};

export default class ProdeTournamentRepository {
  /* --------------- CREATE PRODE TOURNAMENT --------------- */
  createProdeTournament = async ({ name, year, months, participants }) => {
    if (Array.isArray(participants) && participants.length > 0) {
      await validateParticipants(participants);
    }

    return ProdeTournament.create({
      name: name.trim(),
      year,
      months,
      participants: participants ?? [],
    });
  };

  /* --------------- GET ALL PRODE TOURNAMENTS --------------- */
  getAllProdeTournaments = async () => {
    const tournaments = await ProdeTournament.find()
      .populate("participants", "name active")
      .populate("champion", "name")
      .populate("lastPlace", "name")
      .sort({ year: -1, createdAt: -1 })
      .lean();

    /* El índice del admin muestra cuántas fechas tiene cada torneo */
    const counts = await ProdeMatchday.aggregate([
      { $group: { _id: "$tournament", count: { $sum: 1 } } },
    ]);
    const countByTournament = new Map(
      counts.map((c) => [String(c._id), c.count]),
    );

    return tournaments.map((t) => ({
      ...t,
      matchdayCount: countByTournament.get(String(t._id)) ?? 0,
    }));
  };

  /* --------------- GET PRODE TOURNAMENT BY ID --------------- */
  getProdeTournamentById = async (tournamentId) => {
    const tournament = await ProdeTournament.findById(tournamentId)
      .populate("participants", "name active")
      .populate("champion", "name")
      .populate("lastPlace", "name")
      .populate("monthlyWinners.winnerPlayerIds", "name")
      .populate("monthlyWinners.monthlyLoser", "name");
    if (!tournament) throw new Error("Torneo no encontrado");
    return tournament;
  };

  /* --------------- UPDATE PRODE TOURNAMENT --------------- */
  /* El estado NO se edita acá: cambia solo por las transiciones formales
     activate/finish, cada una con sus propias validaciones. */
  updateProdeTournament = async (
    tournamentId,
    { name, year, months, participants },
  ) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    if (name !== undefined) tournament.name = name.trim();
    if (year !== undefined) tournament.year = year;
    if (months !== undefined) tournament.months = months;

    if (participants !== undefined) {
      if (participants.length > 0) await validateParticipants(participants);
      tournament.participants = participants;
    }

    return tournament.save();
  };

  /* --------------- ACTIVATE PRODE TOURNAMENT --------------- */
  activateProdeTournament = async (tournamentId) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    if (tournament.status !== "draft") {
      throw new Error("Solo un torneo en borrador puede activarse");
    }
    if (tournament.participants.length === 0) {
      throw new Error(
        "Para activar el torneo primero cargá sus participantes",
      );
    }
    if (tournament.participants.length % 2 !== 0) {
      throw new Error(
        "La cantidad de participantes debe ser par (los duelos son 1 vs 1)",
      );
    }

    tournament.status = "active";
    return tournament.save();
  };

  /* --------------- FINISH PRODE TOURNAMENT --------------- */
  finishProdeTournament = async (tournamentId) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    if (tournament.status !== "active") {
      throw new Error("Solo un torneo activo puede finalizarse");
    }

    const pending = await ProdeMatchday.find({
      tournament: tournamentId,
      phase: { $ne: "consolidated" },
    })
      .select("roundNumber")
      .sort({ roundNumber: 1 });

    if (pending.length > 0) {
      const rounds = pending.map((m) => m.roundNumber).join(", ");
      throw new Error(
        pending.length === 1
          ? `No se puede finalizar: falta consolidar la fecha ${rounds}`
          : `No se puede finalizar: falta consolidar las fechas ${rounds}`,
      );
    }

    /* Honores del torneo (3.5): campeón y último salen de la acumulada
       ordenada por la cadena de desempate canónica */
    const { standings, matchdayCount } =
      await statsRepository.getTournamentStandings(tournamentId);
    if (matchdayCount > 0 && standings.length > 0) {
      tournament.champion = standings[0].player._id;
      tournament.lastPlace = standings[standings.length - 1].player._id;
    }

    tournament.status = "finished";
    await tournament.save();

    /* Finalizar sella TODOS los meses con consolidadas, incluido el último
       (que no tiene "mes posterior" que lo dispare). Va después del save:
       escribe monthlyWinners por updateOne y el doc en memoria no lo pisa */
    await statsRepository.sealMonthlyHonors(tournamentId, { finalize: true });

    return tournament;
  };

  /* --------------- DELETE PRODE TOURNAMENT --------------- */
  deleteProdeTournament = async (tournamentId) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    const hasMatchdays = await ProdeMatchday.exists({
      tournament: tournamentId,
    });
    if (hasMatchdays) {
      throw new Error(
        "No se puede eliminar: el torneo tiene fechas cargadas. Eliminá primero sus fechas.",
      );
    }

    return ProdeTournament.findByIdAndDelete(tournamentId);
  };

  /* --------------- SUPER DELETE PRODE TOURNAMENT --------------- */
  /* SOLO super admin (middleware): borra el torneo COMPLETO en cascada —
     todas sus fechas (consolidadas incluidas) con sus pronósticos, y sus
     universos GDT con planteles y pool. Desaparece de tablas, records y
     H2H. */
  superDeleteProdeTournament = async (tournamentId) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    const matchdayIds = (
      await ProdeMatchday.find({ tournament: tournamentId }, { _id: 1 }).lean()
    ).map((md) => md._id);
    await ProdePrediction.deleteMany({ matchday: { $in: matchdayIds } });
    await ProdeMatchday.deleteMany({ tournament: tournamentId });

    const universeIds = (
      await GdtUniverse.find({ tournament: tournamentId }, { _id: 1 }).lean()
    ).map((universe) => universe._id);
    await GdtSquad.deleteMany({ gdtUniverse: { $in: universeIds } });
    await GdtRealPlayer.deleteMany({ gdtUniverse: { $in: universeIds } });
    await GdtUniverse.deleteMany({ tournament: tournamentId });

    return ProdeTournament.findByIdAndDelete(tournamentId);
  };
}
