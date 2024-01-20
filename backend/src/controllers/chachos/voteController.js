import validateUniquePearls from "../../helpers/validateUniquePearls.js";
import VoteRepository from "../../repository/chachos/voteRepository.js";
const repository = new VoteRepository();

export default class VoteController {
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

  // ---------- CREATE VOTE ----------
  createVoteForRound = async (req, res, next) => {
    try {
      const user = req.user;
      const tournamentRoundId = req.params.pid;

      //Verify if tournament round is open for vote
      const TournamentRoundVoteStatus =
        await repository.verifyTournamentRoundOpenForVote(tournamentRoundId);
      if (!TournamentRoundVoteStatus) {
        throw new Error("Tournament round is not currently open for vote");
      }

      //Verify if pearls voted are complete and without duplicates
      const vote = {
        voter: user.id,
        round: tournamentRoundId,
        evaluation: [
          {
            player: "65a6cc297f343aa94e08bab9",
            points: 9,
          },
          {
            player: "65a9e48d91209489b551cbe1",
            points: 7,
          },
          {
            player: "65aac004fde14a3e6366fbf8",
            points: 2,
          },
          {
            player: "65aac01dd7e7f1daf88f8e27",
            points: 4,
          },
        ],
        white_pearl: "65a6cc297f343aa94e08bab9",
        vanilla_pearl: "65a9e48d91209489b551cbe1",
        ocher_pearl: "65aac01dd7e7f1daf88f8e27",
        black_pearl: "65aac004fde14a3e6366fbf8",
      };

      const pearlsValidation = await validateUniquePearls(vote);
      if (!pearlsValidation.isValid) {
        throw new Error(pearlsValidation.message);
      }

      const voteLoaded = await repository.createVote(
        vote,
        user.id,
        tournamentRoundId
      );

      res.status(200).json({
        message: "Vote has been properly created",
        voteLoaded,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE VOTE ----------
  updateVoteForRound = async (req, res, next) => {
    try {
      const userId = "65a6d0e3f40f338682057f57";
      const tournamentRoundId = req.params.pid;

      const newVoteInfo = {
        evaluation: [
          {
            player: "65a6cc297f343aa94e08bab9",
            points: 3,
          },
          {
            player: "65a9e48d91209489b551cbe1",
            points: 7,
          },
          {
            player: "65aac004fde14a3e6366fbf8",
            points: 2,
          },
          {
            player: "65aac01dd7e7f1daf88f8e27",
            points: 4,
          },
        ],
        black_pearl: "65aac01dd7e7f1daf88f8e27",
      };

      const voteUpdated = await repository.updateVote(
        newVoteInfo,
        userId,
        tournamentRoundId
      );
      res.status(200).json({
        message: `Vote from user with id ${userId} for tournament round with id ${tournamentRoundId} has been properly updated`,
        voteUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE VOTE ----------
  deleteVoteForRound = async (req, res, next) => {
    try {
      const userId = "65a6d0e3f40f338682057f57";
      const tournamentRoundId = req.params.pid;

      const voteDeleted = await repository.deleteVote(
        userId,
        tournamentRoundId
      );
      res.status(200).json({
        message: `Vote from user with id ${userId} for round with id ${tournamentRoundId} has been properly deleted`,
        voteDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
