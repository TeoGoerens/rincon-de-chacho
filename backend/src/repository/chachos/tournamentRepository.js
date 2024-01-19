import Tournament from "../../dao/models/chachos/tournamentModel.js";
import baseRepository from "../baseRepository.js";

export default class TournamentRepository extends baseRepository {
  constructor() {
    super(Tournament);
  }
}
