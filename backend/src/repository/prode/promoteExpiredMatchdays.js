import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";

/* Transición open → in_play "perezosa": no hay cron, cada lectura relevante
   promueve la fecha si el deadline ya venció. El bloqueo duro de la carga
   post-deadline vive además en el upsert de pronósticos.

   Una fecha SIN universo GDT no se promueve (regla del dueño 2026-07-09:
   nunca en juego sin universo — el GDT es parte del duelo). Queda "abierta"
   con la carga igualmente cerrada por deadline, y pasa a en juego sola en
   la próxima lectura después de que el admin le asigne el universo. */

const EXPIRED_OPEN_WITH_UNIVERSE = () => ({
  phase: "open",
  predictionsDeadline: { $lte: new Date() },
  gdtUniverse: { $ne: null },
});

export const promoteExpiredMatchday = async (matchdayId) => {
  await ProdeMatchday.updateOne(
    { _id: matchdayId, ...EXPIRED_OPEN_WITH_UNIVERSE() },
    { $set: { phase: "in_play" } },
  );
};

export const promoteExpiredMatchdaysForTournament = async (tournamentId) => {
  await ProdeMatchday.updateMany(
    { tournament: tournamentId, ...EXPIRED_OPEN_WITH_UNIVERSE() },
    { $set: { phase: "in_play" } },
  );
};

/* Barrido global para el cron: promueve todas las vencidas sin esperar a
   que alguien las lea, para que el aviso de cierre salga en el mismo tick. */
export const promoteAllExpiredMatchdays = async () => {
  await ProdeMatchday.updateMany(EXPIRED_OPEN_WITH_UNIVERSE(), {
    $set: { phase: "in_play" },
  });
};
