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

  /* --------------- GET RECORDS --------------- */
  getProdeRecords = async (req, res, next) => {
    try {
      const records = await repository.getProdeRecords();
      res.status(200).json({
        message: "Prode records retrieved successfully",
        records,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET HEAD TO HEAD --------------- */
  getProdeH2H = async (req, res, next) => {
    try {
      const { playerA, playerB } = req.query;
      const h2h = await repository.getProdeH2H(playerA, playerB);
      res.status(200).json({
        message: "Prode head to head retrieved successfully",
        h2h,
      });
    } catch (error) {
      next(error);
    }
  };
}
