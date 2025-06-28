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
}
