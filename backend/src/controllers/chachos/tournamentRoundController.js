import defineMatchOutcome from "../../helpers/winDrawDefeatChachos.js";
import TournamentRoundRepository from "../../repository/chachos/tournamentRoundRepository.js";
const repository = new TournamentRoundRepository();

export default class TournamentRoundController {
  // ---------- GET TOURNAMENT ROUND BY ID ----------
  getTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const tournamentRound = await repository.baseGetById(tournamentRoundId);
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
      const tournamentRounds = await repository.baseGetAll();
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
      const tournamentRound = {
        tournament: "65a9e81e3140c1302a39a0b8",
        rival: "65a9e25708c645473df09ac7",
        match_date: Date.now(),
        score_chachos: 7,
        score_rival: 1,
        players: [],
        white_pearl: undefined,
        vanilla_pearl: undefined,
        ocher_pearl: undefined,
        black_pearl: undefined,
        open_for_vote: false,
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

      res.status(200).json({
        message: `Tournament round with id ${tournamentRoundId} has toggled its open_for_vote status to ${tournamentRound.open_for_vote}`,
        tournamentRound,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE TOURNAMENT ROUND ----------
  updateTournamentRoundById = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;

      const newTournamentRoundInfo = {
        players: [
          "65a6cc297f343aa94e08bab9",
          "65a9e48d91209489b551cbe1",
          "65aac004fde14a3e6366fbf8",
          "65aac0327501d9e2c15c953e",
        ],
        white_pearl: "65a6cc297f343aa94e08bab9",
        black_pearl: "65a9e48d91209489b551cbe1",
      };

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
