import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import baseRepository from "../baseRepository.js";

export default class MatchStatRepository extends baseRepository {
  constructor() {
    super(MatchStat);
  }

  // ---------- GET MATCH STAT BY ID ----------
  getMatchStatById = async (matchStatId) => {
    try {
      const documentExists = await this.model.findById(matchStatId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      return documentExists;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET MATCH STAT BY ROUND ----------
  getMatchStatByRound = async (tournamentRoundId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      const roundMatchStat = await this.model.find({
        round: tournamentRoundId,
      });

      return roundMatchStat;
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

  // ---------- UPDATE VOTE ----------
  updateMatchStat = async (newMatchStatInfo, matchStatId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        _id: matchStatId,
      });

      if (!documentExists) {
        throw new Error(
          `This match stat document does not currently exist in database`
        );
      }
      const document = await this.model.updateOne(
        {
          _id: matchStatId,
        },
        newMatchStatInfo
      );
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- DELETE VOTE ----------
  deleteMatchStat = async (matchStatId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        _id: matchStatId,
      });

      if (!documentExists) {
        throw new Error(
          `This match stat document does not currently exist in database`
        );
      }
      const document = await this.model.deleteOne({
        _id: matchStatId,
      });
      return document;
    } catch (error) {
      throw error;
    }
  };
}
