import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import User from "../../dao/models/userModel.js";

export default class ProdePlayerRepository {
  /* --------------- GET MY PRODE PLAYER --------------- */
  /* Jugador de Prode vinculado al usuario logueado (null si no está
     vinculado): el frontend lo usa para saber qué mostrar sin exigir ser
     participante */
  getMyProdePlayer = async (userId) => {
    const user = await User.findById(userId, { prode_player: 1 }).populate(
      "prode_player",
      "name active",
    );
    return user?.prode_player ?? null;
  };

  /* --------------- CREATE PRODE PLAYER --------------- */
  createProdePlayer = async ({ name, active }) => {
    const exists = await ProdePlayer.findOne({ name: name.trim() });
    if (exists) throw new Error("Ya existe un jugador con ese nombre");

    return ProdePlayer.create({ name: name.trim(), active });
  };

  /* --------------- GET ALL PRODE PLAYERS --------------- */
  getAllProdePlayers = async () => {
    return ProdePlayer.find().sort({ name: 1 });
  };

  /* --------------- GET PRODE PLAYER BY ID --------------- */
  getProdePlayerById = async (playerId) => {
    const player = await ProdePlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado");
    return player;
  };

  /* --------------- UPDATE PRODE PLAYER --------------- */
  updateProdePlayer = async (playerId, { name, active }) => {
    const player = await ProdePlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado");

    if (name !== undefined) {
      const duplicate = await ProdePlayer.findOne({
        name: name.trim(),
        _id: { $ne: playerId },
      });
      if (duplicate) throw new Error("Ya existe un jugador con ese nombre");
      player.name = name.trim();
    }
    if (active !== undefined) player.active = active;

    return player.save();
  };

  /* --------------- DELETE PRODE PLAYER --------------- */
  /* Un jugador con historial no se borra (se desactiva): borrar rompería
     las estadísticas de fechas y torneos ya jugados. */
  deleteProdePlayer = async (playerId) => {
    const player = await ProdePlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado");

    const [inDuels, inTournaments, inPredictions, inSquads] =
      await Promise.all([
        ProdeMatchday.exists({
          $or: [
            { "duels.playerA": playerId },
            { "duels.playerB": playerId },
          ],
        }),
        ProdeTournament.exists({
          $or: [
            { participants: playerId },
            { champion: playerId },
            { lastPlace: playerId },
            { "monthlyWinners.winnerPlayerIds": playerId },
            { "monthlyWinners.monthlyLoser": playerId },
          ],
        }),
        ProdePrediction.exists({ player: playerId }),
        GdtSquad.exists({ player: playerId }),
      ]);

    if (inDuels || inTournaments || inPredictions || inSquads) {
      throw new Error(
        "No se puede eliminar: el jugador tiene historial en el Prode. Podés desactivarlo en su lugar.",
      );
    }

    return ProdePlayer.findByIdAndDelete(playerId);
  };

  /* --------------- SUPER DELETE PRODE PLAYER --------------- */
  /* SOLO super admin (middleware): borra al jugador CON TODO su rastro —
     pronósticos, planteles GDT, sus duelos en todas las fechas (sin el
     jugador no significan nada; el rival pierde esos resultados), su lugar
     en participantes/honores de los torneos y el vínculo con el user. */
  superDeleteProdePlayer = async (playerId) => {
    const player = await ProdePlayer.findById(playerId);
    if (!player) throw new Error("Jugador no encontrado");

    await ProdePrediction.deleteMany({ player: playerId });
    await GdtSquad.deleteMany({ player: playerId });

    await ProdeMatchday.updateMany(
      { $or: [{ "duels.playerA": playerId }, { "duels.playerB": playerId }] },
      {
        $pull: {
          duels: { $or: [{ playerA: playerId }, { playerB: playerId }] },
        },
      },
    );
    await ProdeMatchday.updateMany(
      { reopenedFor: playerId },
      { $pull: { reopenedFor: playerId } },
    );

    await ProdeTournament.updateMany(
      {},
      {
        $pull: {
          participants: playerId,
          "monthlyWinners.$[].winnerPlayerIds": playerId,
        },
      },
    );
    await ProdeTournament.updateMany(
      { champion: playerId },
      { $set: { champion: null } },
    );
    await ProdeTournament.updateMany(
      { lastPlace: playerId },
      { $set: { lastPlace: null } },
    );
    await ProdeTournament.updateMany(
      { "monthlyWinners.monthlyLoser": playerId },
      { $set: { "monthlyWinners.$[entry].monthlyLoser": null } },
      { arrayFilters: [{ "entry.monthlyLoser": playerId }] },
    );

    await User.updateMany(
      { prode_player: playerId },
      { $set: { prode_player: null } },
    );

    return ProdePlayer.findByIdAndDelete(playerId);
  };
}
