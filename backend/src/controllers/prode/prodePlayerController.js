import ProdePlayerRepository from "../../repository/prode/prodePlayerRepository.js";

const repository = new ProdePlayerRepository();

export default class ProdePlayerController {
  /* --------------- GET MY PRODE PLAYER --------------- */
  getMyProdePlayer = async (req, res, next) => {
    try {
      const player = await repository.getMyProdePlayer(req.user.id);
      res.status(200).json({
        message: "My Prode player retrieved successfully",
        player,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CREATE PRODE PLAYER --------------- */
  createProdePlayer = async (req, res, next) => {
    try {
      const { name, active } = req.body;
      if (!name || !name.trim()) {
        throw new Error("El nombre del jugador es obligatorio");
      }

      const playerCreated = await repository.createProdePlayer({
        name,
        active,
      });
      res.status(201).json({
        message: "Prode player created successfully",
        playerCreated,
      });
    } catch (error) {
      next(error);
    }
  };

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

  /* --------------- GET PRODE PLAYER BY ID --------------- */
  getProdePlayerById = async (req, res, next) => {
    try {
      const player = await repository.getProdePlayerById(req.params.id);
      res
        .status(200)
        .json({ message: "Prode player retrieved successfully", player });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PRODE PLAYER --------------- */
  updateProdePlayer = async (req, res, next) => {
    try {
      const { name, active } = req.body;
      const playerUpdated = await repository.updateProdePlayer(req.params.id, {
        name,
        active,
      });
      res.status(200).json({
        message: "Prode player updated successfully",
        playerUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PRODE PLAYER --------------- */
  deleteProdePlayer = async (req, res, next) => {
    try {
      await repository.deleteProdePlayer(req.params.id);
      res.status(200).json({ message: "Prode player deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SUPER DELETE PRODE PLAYER (super admin) --------------- */
  superDeleteProdePlayer = async (req, res, next) => {
    try {
      await repository.superDeleteProdePlayer(req.params.id);
      res
        .status(200)
        .json({ message: "Prode player super deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
