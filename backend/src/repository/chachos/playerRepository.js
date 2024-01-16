import Player from "../../dao/models/chachos/playerModel.js";
import baseRepository from "../baseRepository.js";

export default class PlayerRepository extends baseRepository {
  constructor() {
    super(Player);
  }
}
