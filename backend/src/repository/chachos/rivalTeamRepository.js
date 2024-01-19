import RivalTeam from "../../dao/models/chachos/rivalTeamModel.js";
import baseRepository from "../baseRepository.js";

export default class RivalTeamRepository extends baseRepository {
  constructor() {
    super(RivalTeam);
  }
}
