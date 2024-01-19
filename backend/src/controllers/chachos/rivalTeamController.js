import RivalTeamRepository from "../../repository/chachos/rivalTeamRepository.js";
const repository = new RivalTeamRepository();

export default class RivalTeamController {
  // ---------- GET RIVAL TEAM BY ID ----------
  getRivalTeamById = async (req, res, next) => {
    try {
      const rivalTeamId = req.params.pid;
      const rivalTeam = await repository.baseGetById(rivalTeamId);
      res.status(200).json({
        message: `Rival team with id ${rivalTeamId} has been properly retrieved`,
        rivalTeam,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- GET ALL RIVAL TEAMS ----------
  getAllRivalTeams = async (req, res, next) => {
    try {
      const rivalTeams = await repository.baseGetAll();
      res.status(200).json({
        message: "All rival teams have been properly retrieved",
        rivalTeams,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- CREATE RIVAL TEAM ----------
  createRivalTeam = async (req, res, next) => {
    try {
      const rivalTeam = {
        name: "Villa de Mayo",
      };

      const rivalTeamLoaded = await repository.baseCreate(rivalTeam, "name");

      res.status(200).json({
        message: "Rival team has been properly created",
        rivalTeamLoaded,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- UPDATE RIVAL TEAM ----------
  updateRivalTeam = async (req, res, next) => {
    try {
      const rivalTeamId = req.params.pid;

      const newRivalTeamInfo = {
        name: "La Ponderosa",
      };

      const rivalTeamUpdated = await repository.baseUpdateById(
        rivalTeamId,
        newRivalTeamInfo
      );
      res.status(200).json({
        message: `Rival team with id ${rivalTeamId} has been properly updated`,
        rivalTeamUpdated,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- DELETE RIVAL TEAM ----------
  deleteRivalTeamById = async (req, res, next) => {
    try {
      const rivalTeamId = req.params.pid;
      const rivalTeamDeleted = await repository.baseDeleteById(rivalTeamId);
      res.status(200).json({
        message: `Rival team with id ${rivalTeamId} has been properly deleted`,
        rivalTeamDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
