import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import baseRepository from "../baseRepository.js";

export default class MatchStatRepository extends baseRepository {
  constructor() {
    super(MatchStat);
  }

  // ---------- GET MATCH STATS BY ROUND ----------
  getMatchStatByRound = async (roundId) => {
    try {
      const matchStats = await this.model.find({ round: roundId }).populate({
        path: "player",
        select: { first_name: 1, last_name: 1, shirt: 1, field_position: 1, _id: 1 },
      });
      return matchStats;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET MATCH STAT BY FILTER ----------
  getMatchStatFiltered = async (filter) => {
    try {
      const matchStatsFiltered = await this.model.find(filter).populate({
        path: "player",
        select: {
          // Specify fields to include from Player model
          first_name: 1,
          last_name: 1,
          shirt: 1,
          field_position: 1,
          _id: 1, // Exclude unnecessary _id field
        },
      });

      return matchStatsFiltered;
    } catch (error) {
      throw error;
    }
  };

  // ---------- CREATE MATCH STAT ----------
  createMatchStat = async (matchStat, tournamenteRoundId, playerId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        round: tournamenteRoundId,
        player: playerId,
      });

      if (documentExists) {
        throw new Error(
          `A match stat has been already created for this player in this tournament round`
        );
      }
      const document = await this.model.create(matchStat);
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- UPDATE MATCH STAT ----------
  updateMatchStat = async (newMatchStatInfo, filter) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne(filter);

      if (!documentExists) {
        throw new Error(
          `This match stat document does not currently exist in database`
        );
      }
      const document = await this.model.findOneAndUpdate(
        filter,
        newMatchStatInfo,
        { new: true }
      );
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- DELETE VOTE ----------
  deleteMatchStat = async (tournamentRoundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.find({
        round: {
          $eq: tournamentRoundId,
        },
      });

      if (!documentExists) {
        throw new Error(
          `This round do not have any match stats related to it in database`
        );
      }
      const document = await this.model.deleteMany({
        round: {
          $eq: tournamentRoundId,
        },
      });

      return document;
    } catch (error) {
      throw error;
    }
  };
}
