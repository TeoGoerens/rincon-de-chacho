import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";

export default class ProdePlayerRepository {
  /* --------------- GET ALL PRODE PLAYERS --------------- */
  getAllProdePlayers = async () => {
    return ProdePlayer.find().sort({ name: 1 });
  };
}
