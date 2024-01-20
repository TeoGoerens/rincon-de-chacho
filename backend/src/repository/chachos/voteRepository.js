import Vote from "../../dao/models/chachos/voteModel.js";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import baseRepository from "../baseRepository.js";

export default class VoteRepository extends baseRepository {
  constructor() {
    super(Vote);
  }

  // ---------- VERIFY IF TOURNAMENT ROUND IS OPEN FOR VOTE ----------
  verifyTournamentRoundOpenForVote = async (tournamentRoundId) => {
    try {
      const document = await TournamentRound.findById(tournamentRoundId);
      if (!document) {
        throw new Error("Element was not found in the database");
      }

      return document.open_for_vote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- CREATE VOTE ----------
  createVote = async (vote, userId, roundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        voter: userId,
        round: roundId,
      });

      if (documentExists) {
        throw new Error(
          `User with id ${userId} has already voted in this tournament round`
        );
      }
      const document = await this.model.create(vote);
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- UPDATE VOTE ----------
  updateVote = async (vote, userId, roundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        voter: userId,
        round: roundId,
      });

      if (!documentExists) {
        throw new Error(
          `User with id ${userId} has not voted in this tournament round`
        );
      }
      const document = await this.model.updateOne(
        {
          voter: userId,
          round: roundId,
        },
        vote
      );
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- DELETE VOTE ----------
  deleteVote = async (userId, roundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        voter: userId,
        round: roundId,
      });

      if (!documentExists) {
        throw new Error(
          `User with id ${userId} has not voted in this tournament round`
        );
      }
      const document = await this.model.deleteOne({
        voter: userId,
        round: roundId,
      });
      return document;
    } catch (error) {
      throw error;
    }
  };
}
