import MatchStatRepository from "../../repository/chachos/matchStatRepository.js";
const repository = new MatchStatRepository();

export default class MatchStatController {
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
        message: "All votes have been properly retrieved",
        allVotesForRound,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE MATCH STAT ----------
  createMatchStat = async (req, res, next) => {
    try {
      const playerId = "65a6cc297f343aa94e08bab9";
      const tournamentRoundId = "65aaccb5b94a3c9f41816897";
      const matchStat = {
        round: tournamentRoundId,
        player: playerId,
        played: true,
        goals: 1,
        assists: 1,
        yellow_cards: 0,
        red_cards: 0,
        penalty_saved: 0,
      };

      const matchStatLoaded = await repository.createMatchStat(
        matchStat,
        tournamentRoundId,
        playerId
      );

      res.status(200).json({
        message: "Match stat has been properly created",
        matchStatLoaded,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE VOTE ----------
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

  // ---------- DELETE VOTE ----------
  deleteMatchStat = async (req, res, next) => {
    try {
      const matchStatId = req.params.pid;

      const matchStatDeleted = await repository.deleteMatchStat(matchStatId);
      res.status(200).json({
        message: `Match stat with id ${matchStatId} has been properly deleted`,
        matchStatDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
