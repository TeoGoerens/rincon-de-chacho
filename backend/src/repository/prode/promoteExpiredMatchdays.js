import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";

/* Transición open → in_play "perezosa": no hay cron, cada lectura relevante
   promueve la fecha si el deadline ya venció. El bloqueo duro de la carga
   post-deadline vive además en el upsert de pronósticos. */

export const promoteExpiredMatchday = async (matchdayId) => {
  await ProdeMatchday.updateOne(
    {
      _id: matchdayId,
      phase: "open",
      predictionsDeadline: { $lte: new Date() },
    },
    { $set: { phase: "in_play" } },
  );
};

export const promoteExpiredMatchdaysForTournament = async (tournamentId) => {
  await ProdeMatchday.updateMany(
    {
      tournament: tournamentId,
      phase: "open",
      predictionsDeadline: { $lte: new Date() },
    },
    { $set: { phase: "in_play" } },
  );
};
