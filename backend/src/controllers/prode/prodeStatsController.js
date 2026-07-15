import ProdeStatsRepository from "../../repository/prode/prodeStatsRepository.js";

const repository = new ProdeStatsRepository();

export default class ProdeStatsController {
  /* --------------- GET TOURNAMENT STANDINGS --------------- */
  getTournamentStandings = async (req, res, next) => {
    try {
      const { month } = req.query;
      const standings = await repository.getTournamentStandings(
        req.params.tournamentId,
        { month: month || null },
      );
      res.status(200).json({
        message: "Tournament standings retrieved successfully",
        standings,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL-TIME STANDINGS --------------- */
  getAllTimeStandings = async (req, res, next) => {
    try {
      const standings = await repository.getAllTimeStandings();
      res.status(200).json({
        message: "All-time standings retrieved successfully",
        standings,
      });
    } catch (error) {
      next(error);
    }
  };
}
