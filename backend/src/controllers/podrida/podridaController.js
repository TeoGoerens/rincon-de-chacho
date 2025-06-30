import PodridaRepository from "../../repository/podrida/podridaRepository.js";
const repository = new PodridaRepository();

export default class PodridaController {
  /* --------------- CREATE PODRIDA PLAYER --------------- */
  createPodridaPlayer = async (req, res, next) => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        throw new Error("Name and email are required to create a player");
      }

      const playerCreated = await repository.createPodridaPlayer({
        name,
        email,
      });

      res.status(201).json({
        message: "Podrida player created successfully",
        playerCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL PODRIDA PLAYERS --------------- */
  getAllPodridaPlayers = async (req, res, next) => {
    try {
      const players = await repository.getAllPodridaPlayers();

      res.status(200).json({
        message: "All Podrida players retrieved successfully",
        players,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CREATE PODRIDA MATCH --------------- */
  createPodridaMatch = async (req, res, next) => {
    try {
      const matchData = req.body;

      // Validaciones básicas (podés extenderlas más adelante)
      if (
        !matchData.date ||
        !Array.isArray(matchData.players) ||
        matchData.players.length < 5
      ) {
        throw new Error("Missing required match data (date or players)");
      }

      const matchCreated = await repository.createPodridaMatch(matchData);

      res.status(201).json({
        message: "Podrida match created successfully",
        matchCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET LAST PODRIDA MATCH --------------- */
  getLastPodridaMatch = async (req, res, next) => {
    try {
      const lastMatch = await repository.getLastPodridaMatch();

      res.status(200).json({
        message: "Last Podrida match retrieved successfully",
        lastMatch,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA MATCH BY YEAR --------------- */
  getMatchesByYear = async (req, res, next) => {
    try {
      const { year } = req.params;

      const yearNumber = parseInt(year, 10);

      if (isNaN(yearNumber) || yearNumber < 1900 || yearNumber > 3000) {
        throw new Error("Invalid year provided in the URL parameter");
      }

      const matches = await repository.getMatchesByYear(yearNumber);

      res.status(200).json({
        message: `Matches for year ${yearNumber} retrieved successfully`,
        matches,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET ALL PODRIDA MATCHES --------------- */
  getAllPodridaMatches = async (req, res, next) => {
    try {
      const matches = await repository.getAllPodridaMatches();

      res.status(200).json({
        message: "All Podrida matches retrieved successfully",
        matches,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA RECORDS --------------- */
  getPodridaRecords = async (req, res, next) => {
    try {
      const { year } = req.query;

      const records = await repository.getPodridaRecords(year);

      // Obtener todos los años disponibles a partir de las fechas de partidas
      const allMatches = await repository.getAllPodridaMatches();
      const availableYears = [
        ...new Set(allMatches.map((m) => new Date(m.date).getFullYear())),
      ].sort((a, b) => b - a); // orden descendente

      res.status(200).json({
        message: year
          ? `Records for year ${year} retrieved successfully`
          : "All-time records retrieved successfully",
        records,
        availableYears,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA RANKING --------------- */
  getRanking = async (req, res, next) => {
    try {
      const year = req.query.year;
      const ranking = await repository.getRanking(year);

      res.status(200).json({
        message: "Ranking has been properly calculated",
        ranking,
      });
    } catch (error) {
      console.error("Error in getRanking:", error);
      next(error);
    }
  };

  /* --------------- DELETE PODRIDA MATCH --------------- */
  deletePodridaMatch = async (req, res, next) => {
    try {
      const { id } = req.params;

      const deleted = await repository.deletePodridaMatch(id);

      if (!deleted) {
        return res.status(404).json({ message: "Partida no encontrada" });
      }

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

      const updatedMatch = await repository.updatePodridaMatch(
        matchId,
        matchData
      );

      res.status(200).json({
        message: "Partida actualizada con éxito",
        match: updatedMatch,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PODRIDA MATCH BY ID --------------- */
  getPodridaMatchById = async (req, res) => {
    try {
      const { id } = req.params;

      const match = await repository.getPodridaMatchById(id);

      if (!match) {
        return res.status(404).json({ message: "Partida no encontrada" });
      }

      res.status(200).json({
        message: "Partida obtenida correctamente",
        match,
      });
    } catch (error) {
      console.error("❌ Error al obtener partida:", error);
      res.status(500).json({ message: "Error al obtener la partida" });
    }
  };

  /* --------------- GET PLAYER BY ID --------------- */
  getPodridaPlayerById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const player = await repository.getPodridaPlayerById(id);

      if (!player) {
        return res.status(404).json({ message: "Jugador no encontrado" });
      }

      res
        .status(200)
        .json({ message: "Jugador obtenido correctamente", player });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE PLAYER --------------- */
  updatePodridaPlayer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      if (!name || !email) {
        throw new Error("Nombre y email son obligatorios para actualizar");
      }

      const updatedPlayer = await repository.updatePodridaPlayer(id, {
        name,
        email,
      });

      res.status(200).json({
        message: "Jugador actualizado correctamente",
        updatedPlayer,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PLAYER --------------- */
  deletePodridaPlayer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await repository.deletePodridaPlayer(id);

      if (!deleted) {
        return res.status(404).json({ message: "Jugador no encontrado" });
      }

      res.status(200).json({ message: "Jugador eliminado correctamente" });
    } catch (error) {
      next(error);
    }
  };
}
