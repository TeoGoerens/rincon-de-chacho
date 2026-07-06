import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";

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
    return ProdeTournament.find()
      .populate("participants", "name active")
      .populate("champion", "name")
      .populate("lastPlace", "name")
      .sort({ year: -1, createdAt: -1 });
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
  updateProdeTournament = async (
    tournamentId,
    { name, year, months, status, participants },
  ) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");

    if (name !== undefined) tournament.name = name.trim();
    if (year !== undefined) tournament.year = year;
    if (months !== undefined) tournament.months = months;
    if (status !== undefined) tournament.status = status;

    if (participants !== undefined) {
      if (participants.length > 0) await validateParticipants(participants);
      tournament.participants = participants;
    }

    return tournament.save();
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
}
