import PodridaRepository from "../../repository/podrida/podridaRepository.js";
const repository = new PodridaRepository();

export default class PodridaController {
  /* --------------- CREATE PODRIDA PLAYER --------------- */
  createPodridaPlayer = async (req, res, next) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) throw new Error("Name and email are required to create a player");

      const playerCreated = await repository.createPodridaPlayer({ name, email });
      res.status(201).json({ message: "Podrida player created successfully", playerCreated });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL PODRIDA PLAYERS --------------- */
  getAllPodridaPlayers = async (req, res, next) => {
    try {
      const players = await repository.getAllPodridaPlayers();
      res.status(200).json({ message: "All Podrida players retrieved successfully", players });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CREATE PODRIDA MATCH --------------- */
  createPodridaMatch = async (req, res, next) => {
    try {
      const matchData = req.body;
      if (!matchData.date || !Array.isArray(matchData.players) || matchData.players.length < 5) {
        throw new Error("Missing required match data (date or players)");
      }

      const matchCreated = await repository.createPodridaMatch(matchData);
      res.status(201).json({ message: "Podrida match created successfully", matchCreated });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET LAST PODRIDA MATCH --------------- */
  getLastPodridaMatch = async (req, res, next) => {
    try {
      const { lastMatch, playerPictures } = await repository.getLastPodridaMatch();
      res.status(200).json({ message: "Last Podrida match retrieved successfully", lastMatch, playerPictures });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL PODRIDA MATCHES --------------- */
  getAllPodridaMatches = async (req, res, next) => {
    try {
      const matches = await repository.getAllPodridaMatches();
      res.status(200).json({ message: "All Podrida matches retrieved successfully", matches });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA STATS --------------- */
  getPodridaStats = async (req, res, next) => {
    try {
      const stats = await repository.getPodridaStats();
      res.status(200).json({ message: "Podrida stats retrieved successfully", ...stats });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA RANKING --------------- */
  getRanking = async (req, res, next) => {
    try {
      const year = req.query.year;
      const { ranking, totalMatches, filteredMatches, availableYears } = await repository.getRanking(year);
      res.status(200).json({ message: "Ranking has been properly calculated", ranking, totalMatches, filteredMatches, availableYears });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA PLAYER PROFILE --------------- */
  getPodridaPlayerProfile = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = await repository.getPodridaPlayerProfile(id);
      res.status(200).json({ message: "Podrida player profile retrieved successfully", ...data });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PODRIDA MATCH --------------- */
  deletePodridaMatch = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await repository.deletePodridaMatch(id);
      if (!deleted) return res.status(404).json({ message: "Partida no encontrada" });
      res.status(200).json({ message: "Partida eliminada con éxito" });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PODRIDA MATCH --------------- */
  updatePodridaMatch = async (req, res, next) => {
    try {
      const matchId = req.params.id;
      const matchData = req.body;
      const updatedMatch = await repository.updatePodridaMatch(matchId, matchData);
      res.status(200).json({ message: "Partida actualizada con éxito", match: updatedMatch });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA MATCH BY ID --------------- */
  getPodridaMatchById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const match = await repository.getPodridaMatchById(id);
      if (!match) return res.status(404).json({ message: "Partida no encontrada" });
      res.status(200).json({ message: "Partida obtenida correctamente", match });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PLAYER BY ID --------------- */
  getPodridaPlayerById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const player = await repository.getPodridaPlayerById(id);
      if (!player) return res.status(404).json({ message: "Jugador no encontrado" });
      res.status(200).json({ message: "Jugador obtenido correctamente", player });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PLAYER --------------- */
  updatePodridaPlayer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      if (!name || !email) throw new Error("Nombre y email son obligatorios para actualizar");

      const updatedPlayer = await repository.updatePodridaPlayer(id, { name, email });
      res.status(200).json({ message: "Jugador actualizado correctamente", updatedPlayer });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PLAYER --------------- */
  deletePodridaPlayer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await repository.deletePodridaPlayer(id);
      if (!deleted) return res.status(404).json({ message: "Jugador no encontrado" });
      res.status(200).json({ message: "Jugador eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  };
}
