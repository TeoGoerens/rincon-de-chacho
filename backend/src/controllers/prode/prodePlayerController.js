import ProdePlayerRepository from "../../repository/prode/prodePlayerRepository.js";

const repository = new ProdePlayerRepository();

export default class ProdePlayerController {
  /* --------------- GET ALL PRODE PLAYERS --------------- */
  getAllProdePlayers = async (req, res, next) => {
    try {
      const players = await repository.getAllProdePlayers();
      res
        .status(200)
        .json({ message: "All Prode players retrieved successfully", players });
    } catch (error) {
      next(error);
    }
  };
}
