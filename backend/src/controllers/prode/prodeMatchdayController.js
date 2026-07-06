import ProdeMatchdayRepository from "../../repository/prode/prodeMatchdayRepository.js";

const repository = new ProdeMatchdayRepository();

const parseDeadline = (value) => {
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("El deadline de pronósticos no es una fecha válida");
  }
  return deadline;
};

export default class ProdeMatchdayController {
  /* --------------- CREATE PRODE MATCHDAY --------------- */
  createProdeMatchday = async (req, res, next) => {
    try {
      const { tournament, month, roundNumber, predictionsDeadline } = req.body;
      if (!tournament) throw new Error("El torneo es obligatorio");
      if (!month) throw new Error("El mes es obligatorio");
      if (!roundNumber || Number.isNaN(Number(roundNumber))) {
        throw new Error("El número de fecha es obligatorio");
      }
      if (!predictionsDeadline) {
        throw new Error("El deadline de pronósticos es obligatorio");
      }

      const matchdayCreated = await repository.createProdeMatchday({
        tournament,
        month,
        roundNumber: Number(roundNumber),
        predictionsDeadline: parseDeadline(predictionsDeadline),
      });
      res.status(201).json({
        message: "Prode matchday created successfully",
        matchdayCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAYS BY TOURNAMENT --------------- */
  getMatchdaysByTournament = async (req, res, next) => {
    try {
      const matchdays = await repository.getMatchdaysByTournament(
        req.params.tournamentId,
      );
      res.status(200).json({
        message: "Prode matchdays retrieved successfully",
        matchdays,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PRODE MATCHDAY BY ID --------------- */
  getProdeMatchdayById = async (req, res, next) => {
    try {
      const matchday = await repository.getProdeMatchdayById(req.params.id);
      res.status(200).json({
        message: "Prode matchday retrieved successfully",
        matchday,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE MATCHDAY META --------------- */
  updateProdeMatchdayMeta = async (req, res, next) => {
    try {
      const { month, roundNumber, predictionsDeadline } = req.body;

      const matchdayUpdated = await repository.updateProdeMatchdayMeta(
        req.params.id,
        {
          month,
          roundNumber:
            roundNumber !== undefined ? Number(roundNumber) : undefined,
          predictionsDeadline:
            predictionsDeadline !== undefined
              ? parseDeadline(predictionsDeadline)
              : undefined,
        },
      );
      res.status(200).json({
        message: "Prode matchday updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SET MATCHDAY DUELS --------------- */
  setProdeMatchdayDuels = async (req, res, next) => {
    try {
      const { duels } = req.body;
      if (!Array.isArray(duels)) {
        throw new Error("Los duelos deben enviarse como lista");
      }

      const matchdayUpdated = await repository.setProdeMatchdayDuels(
        req.params.id,
        duels,
      );
      res.status(200).json({
        message: "Prode matchday duels updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PRODE MATCHDAY --------------- */
  deleteProdeMatchday = async (req, res, next) => {
    try {
      await repository.deleteProdeMatchday(req.params.id);
      res
        .status(200)
        .json({ message: "Prode matchday deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
