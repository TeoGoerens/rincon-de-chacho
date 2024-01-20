import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import baseRepository from "../baseRepository.js";

export default class TournamentRoundRepository extends baseRepository {
  constructor() {
    super(TournamentRound);
  }

  // ---------- PLAYERS DETAILS FROM TOURNAMENT ROUND ----------
  getPlayersDetailFromTournamentRound = async (tournamentRoundId) => {
    try {
      const document = await this.model
        .findById(tournamentRoundId)
        .populate("players");
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  };
}
