import defineMatchOutcome from "../../helpers/winDrawDefeatChachos.js";
import TournamentRoundRepository from "../../repository/chachos/tournamentRoundRepository.js";
import consolidatePearls from "../../helpers/consolidatePearls.js";

const repository = new TournamentRoundRepository();

export default class TournamentRoundController {
  // ---------- GET ROUNDS BY TOURNAMENT ----------
  getRoundsByTournament = async (req, res, next) => {
    try {
      const tournamentId = req.params.pid;
      const tournamentRounds = await repository.getTournamentRoundsByTournament(
        tournamentRoundId
      );
      res.status(200).json({
        message: `Todas las fechas correspondientes al torneo de id ${tournamentId} han sido correctamente recuperadas de la base de datos`,
        tournamentRounds,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET TOURNAMENT ROUND BY ID ----------
  getTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const tournamentRound = await repository.baseGetById(tournamentRoundId, [
        "tournament",
        "rival",
        "players",
        "white_pearl",
        "vanilla_pearl",
        "ocher_pearl",
        "black_pearl",
      ]);
      res.status(200).json({
        message: `Tournament round with id ${tournamentRoundId} has been properly retrieved`,
        tournamentRound,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET PLAYERS FROM TOURNAMENT ROUND BY ID ----------
  getPlayersTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const tournamentRound =
        await repository.getPlayersDetailFromTournamentRound(tournamentRoundId);
      const players = tournamentRound.players;
      res.status(200).json({
        message: `Players from tournament round with id ${tournamentRoundId} have been properly retrieved`,
        tournamentRound,
        players,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET ALL TOURNAMENT ROUNDS ----------
  getAllTournamentRounds = async (req, res, next) => {
    try {
      const tournamentRounds = await repository.baseGetAll({
        sortBy: "match_date",
        sortOrder: "desc",
        populateBy: [
          "tournament",
          "rival",
          "players",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ],
      });
      res.status(200).json({
        message: "All tournament rounds have been properly retrieved",
        tournamentRounds,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE TOURNAMENT ROUND ----------
  createTournamentRound = async (req, res, next) => {
    try {
      const parsedDate = new Date(Date.parse(req.body.match_date));
      const tournamentRound = {
        tournament: req.body.tournament,
        rival: req.body.rival,
        match_date: req.body.match_date,
        month: parsedDate.getMonth() + 1,
        year: parsedDate.getFullYear(),
        score_chachos: req.body.score_chachos,
        score_rival: req.body.score_rival,
        players: req.body.players,
      };

      const { win, draw, defeat } = await defineMatchOutcome(
        tournamentRound.score_chachos,
        tournamentRound.score_rival
      );

      tournamentRound.win = win;
      tournamentRound.draw = draw;
      tournamentRound.defeat = defeat;

      const tournamentRoundLoaded = await repository.baseCreate(
        tournamentRound,
        "match_date"
      );

      res.status(200).json({
        message: "Tournament round has been properly created",
        tournamentRoundLoaded,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- TOGGLE OPEN FOR VOTE ----------
  ToggleOpenForVote = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const tournamentRound = await repository.baseGetById(tournamentRoundId);

      tournamentRound.open_for_vote = !tournamentRound.open_for_vote;
      await tournamentRound.save();

      if (tournamentRound.open_for_vote === false) {
        //Send email to all users informing that the tournament round is no longer available to vote. Check results
        await repository.sendEmailToAllUsersToDisplayResults(tournamentRoundId);
      } else {
        //Send email to all users informing that the tournament round is open for vote
        await repository.sendEmailToAllUsersToRequestVotes(tournamentRoundId);
      }

      res.status(200).json({
        message: `Tournament round with id ${tournamentRoundId} has toggled its open_for_vote status to ${tournamentRound.open_for_vote}`,
        tournamentRound,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CONSOLIDATE PEARLS ----------
  consolidatePearls = async (req, res, next) => {
    try {
      //Get information from endpoint and body
      const tournamentRoundId = req.params.pid;
      const votes = req.body.votes;
      const pointsArray = req.body.points;

      //Search for the tournament round information on database
      const tournamentRound = await repository.baseGetById(tournamentRoundId);

      //Votes information consolidation
      const consolidatedVotes = consolidatePearls(votes);
      const whitePearl = consolidatedVotes.white_pearl;
      const vanillaPearl = consolidatedVotes.vanilla_pearl;
      const ocherPearl = consolidatedVotes.ocher_pearl;
      const blackPearl = consolidatedVotes.black_pearl;

      //Update pearls information on match stats collection
      const updatedMatchStatsFromVotes =
        await repository.updateMatchStatsFromVotes(
          tournamentRoundId,
          whitePearl,
          vanillaPearl,
          ocherPearl,
          blackPearl
        );

      //Update points information on match stats collection
      const updatedMatchStatsFromPoints =
        await repository.updateMatchStatsFromPoints(
          tournamentRoundId,
          pointsArray
        );

      //Update tournament round information in database
      tournamentRound.white_pearl = whitePearl;
      tournamentRound.vanilla_pearl = vanillaPearl;
      tournamentRound.ocher_pearl = ocherPearl;
      tournamentRound.black_pearl = blackPearl;
      await tournamentRound.save();

      res.status(200).json({
        message: `Pearls have been properly consolidated`,
        tournamentRound,
        updatedMatchStatsFromVotes,
        updatedMatchStatsFromPoints,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE TOURNAMENT ROUND ----------
  updateTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const parsedDate = new Date(Date.parse(req.body.match_date));

      const newTournamentRoundInfo = {
        tournament: req.body.tournament,
        rival: req.body.rival,
        match_date: req.body.match_date,
        month: parsedDate.getMonth() + 1,
        year: parsedDate.getFullYear(),
        score_chachos: req.body.score_chachos,
        score_rival: req.body.score_rival,
        players: req.body.players,
      };

      const { win, draw, defeat } = await defineMatchOutcome(
        newTournamentRoundInfo.score_chachos,
        newTournamentRoundInfo.score_rival
      );

      newTournamentRoundInfo.win = win;
      newTournamentRoundInfo.draw = draw;
      newTournamentRoundInfo.defeat = defeat;

      const tournamentRoundUpdated = await repository.baseUpdateById(
        tournamentRoundId,
        newTournamentRoundInfo
      );
      res.status(200).json({
        message: `Tournament round with id ${tournamentRoundId} has been properly updated`,
        tournamentRoundUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE TOURNAMENT ROUND ----------
  deleteTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const tournamentRoundDeleted = await repository.baseDeleteById(
        tournamentRoundId
      );
      res.status(200).json({
        message: `Tournament round with id ${tournamentRoundId} has been properly deleted`,
        tournamentRoundDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
