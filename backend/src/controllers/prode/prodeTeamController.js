import ProdeTeamRepository from "../../repository/prode/prodeTeamRepository.js";

const repository = new ProdeTeamRepository();

export default class ProdeTeamController {
  /* --------------- GET ALL PRODE TEAMS --------------- */
  getAllProdeTeams = async (req, res, next) => {
    try {
      const teams = await repository.getAllProdeTeams();
      res
        .status(200)
        .json({ message: "All Prode teams retrieved successfully", teams });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PRODE TEAM --------------- */
  updateProdeTeam = async (req, res, next) => {
    try {
      const { displayName, code } = req.body;
      const teamUpdated = await repository.updateProdeTeam(req.params.id, {
        displayName,
        code,
      });
      res
        .status(200)
        .json({ message: "Prode team updated successfully", teamUpdated });
    } catch (error) {
      next(error);
    }
  };
}
