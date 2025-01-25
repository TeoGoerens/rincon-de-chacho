import MatchStatRepository from "../../repository/chachos/matchStatRepository.js";
import TournamentRoundRepository from "../../repository/chachos/tournamentRoundRepository.js";
const repository = new MatchStatRepository();
const tournamentRoundRepository = new TournamentRoundRepository();

export default class MatchStatController {
  // ---------- GET MATCH STAT OF ALL PLAYERS BY A SPECIFIED ROUND ----------
  getMatchStatByRound = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;

      const roundMatchStat = await repository.getMatchStatByRound(
        tournamentRoundId
      );

      res.status(200).json({
        message:
          "All match stats related to the provided tournament round have been properly retrieved",
        roundMatchStat,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET MATCH STATS FILTERED ----------
  getMatchStatsFiltered = async (req, res, next) => {
    try {
      // Empezamos con un objeto vacío
      let filter = {};

      // 1. Filtro de torneo
      const tournamentId = req.query.tournament || null;
      if (tournamentId !== null) {
        filter.tournament = tournamentId;
      }

      // 2. Filtro de ronda
      const tournamentRoundId = req.query.round || null;
      if (tournamentRoundId !== null) {
        filter.round = tournamentRoundId;
      }

      // 3. Filtro de jugador
      const playerId = req.query.player || null;
      if (playerId !== null) {
        filter.player = playerId;
      }

      // 4. Filtro de año
      const yearParam = req.query.year || null;
      // Si yearParam no es null, convertimos a entero y lo seteamos
      if (yearParam !== null) {
        filter.year = parseInt(yearParam, 10);
      }

      const filteredMatchStats = await repository.getMatchStatFiltered(filter);

      res.status(200).json({
        message:
          "All match stats related to the provided tournament round have been properly retrieved",
        filteredMatchStats,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE MATCH STAT ----------
  createMatchStat = async (req, res, next) => {
    try {
      // Definicion de variables
      const tournamentRoundId = req.params.pid;
      const tournamentRound = await tournamentRoundRepository.baseGetById(
        tournamentRoundId
      );
      const tournamentId = tournamentRound.tournament;

      const matchStats = req.body;

      if (
        !matchStats ||
        !Array.isArray(matchStats) ||
        matchStats.length === 0
      ) {
        return res.status(400).json({
          message:
            "Invalid request body. Please provide an array of match stats.",
        });
      }

      // Comienzo del bucle relativo al array de match stats
      let createdMatchStats = [];
      for (const matchStat of matchStats) {
        try {
          const newMatchStat = {
            tournament: tournamentId,
            round: tournamentRoundId,
            match_date: tournamentRound.match_date,
            month:
              new Date(Date.parse(tournamentRound.match_date)).getMonth() + 1,
            year: new Date(
              Date.parse(tournamentRound.match_date)
            ).getFullYear(),
            player: matchStat.playerId,
            minutes_played: matchStat.minutes_played,
            goals: matchStat.goals,
            assists: matchStat.assists,
            yellow_cards: matchStat.yellow_cards,
            red_cards: matchStat.red_cards,
          };

          const createdMatchStat = await repository.createMatchStat(
            newMatchStat,
            tournamentRoundId,
            matchStat.playerId
          );
          createdMatchStats.push(createdMatchStat);

          tournamentRoundRepository.baseUpdateById(tournamentRoundId, {
            complete_stats: true,
          });
        } catch (error) {
          console.error(`Error creating match stat: ${error.message}`);
          continue;
        }
      }

      res.status(200).json({
        message: "Match stats have been successfully created",
        createdMatchStats,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE MATCH STATS ----------
  updateMatchStat = async (req, res, next) => {
    try {
      const matchStatId = req.params.pid;

      const newMatchStatInfo = {
        goals: 2,
      };

      const matchStatUpdated = await repository.updateMatchStat(
        newMatchStatInfo,
        matchStatId
      );
      res.status(200).json({
        message: `Match stat with id ${matchStatId} has been properly updated`,
        matchStatUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE MATCH STAT ----------
  deleteMatchStat = async (req, res, next) => {
    try {
      // Definicion de variables
      const tournamentRoundId = req.params.pid;

      const matchStatDeleted = await repository.deleteMatchStat(
        tournamentRoundId
      );

      const updatedTournamentRound =
        await tournamentRoundRepository.baseUpdateById(tournamentRoundId, {
          complete_stats: false,
        });

      res.status(200).json({
        message: `Match stats from round ${tournamentRoundId} have been properly deleted`,
        matchStatDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
