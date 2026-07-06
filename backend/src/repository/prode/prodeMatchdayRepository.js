import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import { PRODE_CHALLENGES } from "../../dao/models/prode/prodeConstants.js";

/* Los duelos nacen con los 3 challenges vacíos (scores null): es el mismo
   shape que usan las fechas históricas antes de tener resultados, y lo que
   la consolidación completará al final. */
const buildEmptyChallenges = () =>
  PRODE_CHALLENGES.map((type) => ({
    type,
    scoreA: null,
    scoreB: null,
    result: null,
  }));

const validateDuels = (duels, tournament) => {
  const participantIds = tournament.participants.map(String);
  if (participantIds.length === 0) {
    throw new Error(
      "El torneo no tiene participantes: cargalos antes de armar duelos",
    );
  }

  const expectedDuels = participantIds.length / 2;
  if (duels.length !== expectedDuels) {
    throw new Error(
      `Deben armarse exactamente ${expectedDuels} duelos (${participantIds.length} participantes)`,
    );
  }

  const used = [];
  for (const duel of duels) {
    const a = String(duel.playerA);
    const b = String(duel.playerB);
    if (!duel.playerA || !duel.playerB) {
      throw new Error("Todos los duelos deben tener sus dos jugadores");
    }
    if (a === b) {
      throw new Error("Un duelo no puede enfrentar a un jugador consigo mismo");
    }
    if (!participantIds.includes(a) || !participantIds.includes(b)) {
      throw new Error(
        "Todos los jugadores de los duelos deben ser participantes del torneo",
      );
    }
    used.push(a, b);
  }

  const unique = new Set(used);
  if (unique.size !== used.length) {
    throw new Error("Ningún participante puede estar en más de un duelo");
  }
};

export default class ProdeMatchdayRepository {
  /* --------------- CREATE PRODE MATCHDAY --------------- */
  createProdeMatchday = async ({
    tournament: tournamentId,
    month,
    roundNumber,
    predictionsDeadline,
  }) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");
    if (tournament.status === "finished") {
      throw new Error("El torneo ya está finalizado");
    }
    if (!tournament.months.includes(month)) {
      throw new Error(`El mes "${month}" no forma parte del torneo`);
    }

    const duplicate = await ProdeMatchday.exists({
      tournament: tournamentId,
      roundNumber,
    });
    if (duplicate) {
      throw new Error(
        `Ya existe la fecha número ${roundNumber} en este torneo`,
      );
    }

    return ProdeMatchday.create({
      tournament: tournamentId,
      month,
      roundNumber,
      predictionsDeadline,
      phase: "draft",
      duels: [],
    });
  };

  /* --------------- GET MATCHDAYS BY TOURNAMENT --------------- */
  getMatchdaysByTournament = async (tournamentId) => {
    return ProdeMatchday.find({ tournament: tournamentId })
      .populate("duels.playerA", "name")
      .populate("duels.playerB", "name")
      .sort({ roundNumber: -1 });
  };

  /* --------------- GET PRODE MATCHDAY BY ID --------------- */
  getProdeMatchdayById = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId)
      .populate({
        path: "tournament",
        select: "name year months status participants",
        populate: { path: "participants", select: "name" },
      })
      .populate("duels.playerA", "name")
      .populate("duels.playerB", "name");
    if (!matchday) throw new Error("Fecha no encontrada");
    return matchday;
  };

  /* --------------- UPDATE MATCHDAY META --------------- */
  updateProdeMatchdayMeta = async (
    matchdayId,
    { month, roundNumber, predictionsDeadline },
  ) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase === "consolidated") {
      throw new Error("Una fecha consolidada no se puede modificar");
    }

    const tournament = await ProdeTournament.findById(matchday.tournament);

    if (month !== undefined) {
      if (!tournament.months.includes(month)) {
        throw new Error(`El mes "${month}" no forma parte del torneo`);
      }
      matchday.month = month;
    }

    if (roundNumber !== undefined && roundNumber !== matchday.roundNumber) {
      const duplicate = await ProdeMatchday.exists({
        tournament: matchday.tournament,
        roundNumber,
        _id: { $ne: matchdayId },
      });
      if (duplicate) {
        throw new Error(
          `Ya existe la fecha número ${roundNumber} en este torneo`,
        );
      }
      matchday.roundNumber = roundNumber;
    }

    if (predictionsDeadline !== undefined) {
      matchday.predictionsDeadline = predictionsDeadline;
    }

    return matchday.save();
  };

  /* --------------- SET MATCHDAY DUELS --------------- */
  setProdeMatchdayDuels = async (matchdayId, duels) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "draft" && matchday.phase !== "open") {
      throw new Error(
        "Los duelos solo pueden modificarse mientras la fecha está en borrador o abierta",
      );
    }

    const tournament = await ProdeTournament.findById(matchday.tournament);
    validateDuels(duels, tournament);

    matchday.duels = duels.map((duel) => ({
      playerA: duel.playerA,
      playerB: duel.playerB,
      challenges: buildEmptyChallenges(),
      duelResult: null,
      points: { playerA: 0, playerB: 0, bonusA: 0, bonusB: 0 },
    }));

    return matchday.save();
  };

  /* --------------- DELETE PRODE MATCHDAY --------------- */
  deleteProdeMatchday = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase === "consolidated") {
      throw new Error(
        "Una fecha consolidada no se puede eliminar: tiene resultados históricos",
      );
    }

    const hasPredictions = await ProdePrediction.exists({
      matchday: matchdayId,
    });
    if (hasPredictions) {
      throw new Error(
        "No se puede eliminar: la fecha ya tiene pronósticos cargados",
      );
    }

    return ProdeMatchday.findByIdAndDelete(matchdayId);
  };
}
