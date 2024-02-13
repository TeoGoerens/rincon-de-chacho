import mongoose from "mongoose";
import Vote from "../../dao/models/chachos/voteModel.js";
import User from "../../dao/models/userModel.js";
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

  // ---------- GET ALL VOTES ----------
  getAllVotes = async () => {
    try {
      //Return all votes
      const allVotes = await this.model
        .find()
        .populate([
          "voter",
          "round",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ])
        .populate({
          path: "evaluation",
          populate: { path: "player", model: "Player" },
        });
      return allVotes;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET VOTE FROM SPECIFIC USER FOR A ROUND ----------
  getVotefromUserByRound = async (tournamentRoundId, voterId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (!userIsAdmin && (usersVote == null || usersVote == undefined)) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return vote from requested voter
      const requestedVote = await this.model.find({
        round: tournamentRoundId,
        voter: voterId,
      });

      if (requestedVote.length === 0) {
        throw new Error(
          "The selected voter has not yet submitted results. No information to display"
        );
      }

      return requestedVote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET VOTES RECEIVED BY A PLAYER FOR A ROUND ----------
  getVoteForAPlayerByRound = async (tournamentRoundId, playerId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (!userIsAdmin && (usersVote == null || usersVote == undefined)) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return votes received for requested player
      const requestedVote = await this.model.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { white_pearl: new mongoose.Types.ObjectId(playerId) },
                  { vanilla_pearl: new mongoose.Types.ObjectId(playerId) },
                  { ocher_pearl: new mongoose.Types.ObjectId(playerId) },
                  { black_pearl: new mongoose.Types.ObjectId(playerId) },
                ],
              },
              { round: new mongoose.Types.ObjectId(tournamentRoundId) },
            ],
          },
        },
        {
          $project: {
            voter: 1,
            round: 1,
            white_pearl: {
              $cond: {
                if: {
                  $eq: ["$white_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$white_pearl",
                else: null,
              },
            },
            vanilla_pearl: {
              $cond: {
                if: {
                  $eq: [
                    "$vanilla_pearl",
                    new mongoose.Types.ObjectId(playerId),
                  ],
                },
                then: "$vanilla_pearl",
                else: null,
              },
            },
            ocher_pearl: {
              $cond: {
                if: {
                  $eq: ["$ocher_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$ocher_pearl",
                else: null,
              },
            },
            black_pearl: {
              $cond: {
                if: {
                  $eq: ["$black_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$black_pearl",
                else: null,
              },
            },

            evaluation: {
              $filter: {
                input: "$evaluation",
                as: "eval",
                cond: {
                  $eq: ["$$eval.player", new mongoose.Types.ObjectId(playerId)],
                },
              },
            },
          },
        },
      ]);
      console.log(requestedVote);

      if (requestedVote.length === 0) {
        throw new Error(
          "The selected player has not been assigned any votes in this round"
        );
      }

      return requestedVote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET ALL VOTES FOR ROUND ----------
  getAllVotesForRound = async (tournamentRoundId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (!userIsAdmin && (usersVote == null || usersVote == undefined)) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return all votes
      const allVotes = await this.model
        .find({ round: tournamentRoundId })
        .populate([
          "voter",
          "round",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ])
        .populate({
          path: "evaluation",
          populate: { path: "player", model: "Player" },
        });
      return allVotes;
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
  deleteVoteById = async (voteId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        _id: voteId,
      });

      if (!documentExists) {
        throw new Error(
          `El voto que desea eliminar no existe en la base de datos`
        );
      }
      const document = await this.model.deleteOne({
        _id: voteId,
      });
      return document;
    } catch (error) {
      throw error;
    }
  };
}
