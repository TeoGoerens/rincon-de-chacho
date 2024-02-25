import validateUniquePearls from "../../helpers/validateUniquePearls.js";
import VoteRepository from "../../repository/chachos/voteRepository.js";
const repository = new VoteRepository();

export default class VoteController {
  // ---------- GET ALL VOTES ----------
  getAllVotes = async (req, res, next) => {
    try {
      const allVotes = await repository.getAllVotes();

      res.status(200).json({
        message:
          "Todos los votos han sido recuperados exitosamente de la base de datos",
        allVotes,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET USER'S VOTE IN A ROUND ----------
  getVoteByRoundAndUser = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const voterId = req.params.vid;
      const userId = req.user.id;

      const usersVote = await repository.getVotefromUserByRound(
        tournamentRoundId,
        voterId,
        userId
      );

      res.status(200).json({
        message:
          "User's vote has been properly retrieved for the current round",
        usersVote,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET VOTES RECEIVED BY A PLAYER IN A ROUND ----------
  getVoteByRoundAndPlayer = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const playerId = req.params.cid;
      const userId = req.user.id;

      const playersVote = await repository.getVoteForAPlayerByRound(
        tournamentRoundId,
        playerId,
        userId
      );

      res.status(200).json({
        message:
          "Votes assigned to requested player have been properly retrieved for the current round",
        playersVote,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET ALL VOTES FOR ROUND ----------
  getAllVotesForRound = async (req, res, next) => {
    try {
      const tournamentRoundId = req.params.pid;
      const userId = req.user.id;

      const allVotesForRound = await repository.getAllVotesForRound(
        tournamentRoundId,
        userId
      );

      res.status(200).json({
        message:
          "Todos los votos de la fecha han sido recuperados exitosamente de la base de datos",
        allVotesForRound,
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
        evaluation: req.body.evaluation,
        white_pearl: req.body.white_pearl,
        vanilla_pearl: req.body.vanilla_pearl,
        ocher_pearl: req.body.ocher_pearl,
        black_pearl: req.body.black_pearl,
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
        message: "Tu voto fue correctamente registrado",
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
  deleteVoteById = async (req, res, next) => {
    try {
      const voteId = req.params.pid;

      const voteDeleted = await repository.deleteVoteById(voteId);
      res.status(200).json({
        message: `Vote has been properly deleted`,
        voteDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
