import TournamentRepository from "../../repository/chachos/tournamentRepository.js";
const repository = new TournamentRepository();

export default class TournamentController {
  // ---------- GET TOURNAMENT BY ID ----------
  getTournamentById = async (req, res, next) => {
    try {
      const tournamentId = req.params.pid;
      const tournament = await repository.baseGetById(tournamentId);
      res.status(200).json({
        message: `Tournament with id ${tournamentId} has been properly retrieved`,
        tournament,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- GET ALL TOURNAMENTS ----------
  getAllTournaments = async (req, res, next) => {
    try {
      const tournaments = await repository.baseGetAll();
      res.status(200).json({
        message: "All tournaments have been properly retrieved",
        tournaments,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- CREATE TOURNAMENT ----------
  createTournament = async (req, res, next) => {
    try {
      const tournament = {
        name: "Copa Super 8 CUBA",
        year: 2024,
        category: "65a9bfe3bcf0281e6cfbddde",
      };

      const tournamentLoaded = await repository.baseCreate(tournament, "name");

      res.status(200).json({
        message: "Tournament has been properly created",
        tournamentLoaded,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- UPDATE TOURNAMENT ----------
  updateTournamentById = async (req, res, next) => {
    try {
      const tournamentId = req.params.pid;

      const newTournamentInfo = {
        name: "Gaucho Gil",
        year: 2025,
      };

      const tournamentUpdated = await repository.baseUpdateById(
        tournamentId,
        newTournamentInfo
      );
      res.status(200).json({
        message: `Tournament with id ${tournamentId} has been properly updated`,
        tournamentUpdated,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- DELETE TOURNAMENT ----------
  deleteTournamentById = async (req, res, next) => {
    try {
      const tournamentId = req.params.pid;
      const tournamentDeleted = await repository.baseDeleteById(tournamentId);
      res.status(200).json({
        message: `Tournament with id ${tournamentId} has been properly deleted`,
        tournamentDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
