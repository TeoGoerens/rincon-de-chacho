import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import { PICK_1X2 } from "../../dao/models/prode/prodeConstants.js";
import { promoteExpiredMatchday } from "./promoteExpiredMatchdays.js";
import { computeMatchdayPartials } from "../../helpers/prodeScoring.js";

const isValidScore = (value) => Number.isInteger(value) && value >= 0;

const isReopenedFor = (matchday, playerId) =>
  (matchday.reopenedFor ?? []).map(String).includes(String(playerId));

/* La fecha y la pertenencia del jugador al torneo se validan juntas: todo
   acceso a un pronóstico (lectura o escritura) exige ser participante del
   torneo de esa fecha. */
const getMatchdayForParticipant = async (matchdayId, playerId) => {
  await promoteExpiredMatchday(matchdayId);
  const matchday = await ProdeMatchday.findById(matchdayId);
  if (!matchday) throw new Error("Fecha no encontrada");

  const tournament = await ProdeTournament.findById(matchday.tournament, {
    participants: 1,
  });
  const participantIds = (tournament?.participants ?? []).map(String);
  if (!participantIds.includes(String(playerId))) {
    const error = new Error("No sos participante del torneo de esta fecha");
    error.status = 403;
    throw error;
  }

  return matchday;
};

/* Normaliza y valida los picks contra los ítems reales de la fecha.
   Carga parcial válida A NIVEL FECHA: se pueden dejar ítems sin pronosticar.
   Pero el pronóstico de un partido va COMPLETO o no va (decisión del dueño
   2026-07-07): resultado 1X2 + marcador juntos — los VALORES siguen siendo
   independientes (pueden contradecirse a propósito), lo obligatorio es que
   estén ambos. */
const buildValidatedPicks = (picks, matchday) => {
  if (!Array.isArray(picks)) {
    throw new Error("Los pronósticos deben enviarse como lista");
  }

  const seen = new Set();
  const validated = [];

  for (const pick of picks) {
    const item = matchday.items.id(pick.item);
    if (!item) {
      throw new Error(
        "El pronóstico referencia un ítem que ya no existe en la fecha",
      );
    }
    if (seen.has(String(item._id))) {
      throw new Error("Hay más de un pronóstico para el mismo ítem");
    }
    seen.add(String(item._id));

    if (item.kind === "match") {
      const pick1x2 = pick.pick1x2 ?? null;
      if (pick1x2 !== null && !PICK_1X2.includes(pick1x2)) {
        throw new Error("El pick 1X2 debe ser local, empate o visitante");
      }

      const predictedHome = pick.predictedHome ?? null;
      const predictedAway = pick.predictedAway ?? null;
      const hasScore = predictedHome !== null || predictedAway !== null;
      const hasFullScore = predictedHome !== null && predictedAway !== null;

      if (pick1x2 === null && !hasScore) continue;
      if (pick1x2 === null || !hasFullScore) {
        throw new Error(
          `El pronóstico de ${item.homeName} vs ${item.awayName} está incompleto: elegí el resultado y cargá el marcador, o dejalo vacío`,
        );
      }
      if (!isValidScore(predictedHome) || !isValidScore(predictedAway)) {
        throw new Error(
          "Los goles del marcador deben ser enteros de 0 o más",
        );
      }

      validated.push({
        item: item._id,
        pick1x2,
        predictedHome,
        predictedAway,
        answerText: "",
        isCorrect: null,
      });
      continue;
    }

    /* kind: "question" — isCorrect es arbitraje del admin (paso 1.7),
       nunca se acepta del participante */
    const answerText =
      typeof pick.answerText === "string" ? pick.answerText.trim() : "";
    if (!answerText) continue;
    validated.push({
      item: item._id,
      pick1x2: null,
      predictedHome: null,
      predictedAway: null,
      answerText,
      isCorrect: null,
    });
  }

  return validated;
};

export default class ProdePredictionRepository {
  /* --------------- GET MY PREDICTION --------------- */
  getMyPrediction = async (matchdayId, playerId) => {
    await getMatchdayForParticipant(matchdayId, playerId);
    return ProdePrediction.findOne({ matchday: matchdayId, player: playerId });
  };

  /* --------------- UPSERT MY PREDICTION --------------- */
  upsertMyPrediction = async (matchdayId, playerId, picks) => {
    const matchday = await getMatchdayForParticipant(matchdayId, playerId);
    const now = new Date();

    const isOpen =
      matchday.phase === "open" &&
      matchday.predictionsDeadline &&
      matchday.predictionsDeadline > now;
    const isReopened =
      matchday.phase === "in_play" && isReopenedFor(matchday, playerId);

    if (!isOpen && !isReopened) {
      if (matchday.phase === "open") {
        throw new Error(
          "El deadline de pronósticos ya venció: la carga está cerrada",
        );
      }
      throw new Error("La fecha no está abierta para cargar pronósticos");
    }

    let validatedPicks = buildValidatedPicks(picks, matchday);

    /* Rezagado: los partidos con kickoff pasado quedan intocables — lo que
       mande el body para esos ítems se descarta y se preserva lo que hubiera
       guardado antes del deadline. */
    if (isReopened) {
      const lockedIds = new Set(
        matchday.items
          .filter(
            (item) =>
              item.kind === "match" &&
              item.kickoffAt &&
              item.kickoffAt <= now,
          )
          .map((item) => String(item._id)),
      );
      const existing = await ProdePrediction.findOne({
        matchday: matchdayId,
        player: playerId,
      });
      const preserved = (existing?.picks ?? []).filter((pick) =>
        lockedIds.has(String(pick.item)),
      );
      validatedPicks = [
        ...validatedPicks.filter(
          (pick) => !lockedIds.has(String(pick.item)),
        ),
        ...preserved,
      ];
    }

    /* Pisar picks completos es seguro: el arbitraje (isCorrect, paso 1.7)
       ocurre post-deadline, cuando esta escritura ya está bloqueada. */
    const prediction = await ProdePrediction.findOneAndUpdate(
      { matchday: matchdayId, player: playerId },
      { picks: validatedPicks, submittedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    /* El guardado del rezagado consume su reapertura: recién ahí puede ver
       los pronósticos de los demás. */
    if (isReopened) {
      await ProdeMatchday.updateOne(
        { _id: matchdayId },
        { $pull: { reopenedFor: playerId } },
      );
    }

    return prediction;
  };

  /* --------------- GET MATCHDAY PREDICTIONS (todos) --------------- */
  /* Visibilidad post-deadline: los pronósticos ajenos existen SOLO para
     participantes, con la fecha ya en juego o consolidada, y nunca para un
     rezagado que todavía no consumió su reapertura. */
  getMatchdayPredictions = async (matchdayId, playerId) => {
    const matchday = await getMatchdayForParticipant(matchdayId, playerId);

    if (matchday.phase !== "in_play" && matchday.phase !== "consolidated") {
      throw new Error(
        "Los pronósticos de todos se muestran recién después del deadline",
      );
    }
    if (isReopenedFor(matchday, playerId)) {
      const error = new Error(
        "Tenés la carga reabierta: vas a ver los pronósticos de los demás cuando guardes y cierres la tuya",
      );
      error.status = 403;
      throw error;
    }

    return ProdePrediction.find({ matchday: matchdayId }).populate(
      "player",
      "name",
    );
  };

  /* --------------- GET MATCHDAY PREDICTIONS (admin) --------------- */
  /* El admin necesita las respuestas de todos para arbitrar las preguntas,
     sin exigirle ser participante. */
  getMatchdayPredictionsAdmin = async (matchdayId) => {
    const matchday = await ProdeMatchday.exists({ _id: matchdayId });
    if (!matchday) throw new Error("Fecha no encontrada");
    return ProdePrediction.find({ matchday: matchdayId }).populate(
      "player",
      "name",
    );
  };

  /* --------------- JUDGE QUESTION --------------- */
  /* Arbitraje manual de una pregunta: escribe isCorrect en el pick de cada
     participante (true/false, o null para des-arbitrar). Solo quienes
     respondieron tienen pick; el resto va 0 sin arbitraje. */
  judgeProdeQuestion = async (matchdayId, itemId, verdicts) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error("Las preguntas se arbitran con la fecha en juego");
    }

    const item = matchday.items.id(itemId);
    if (!item) throw new Error("Ítem no encontrado en la fecha");
    if (item.kind !== "question") {
      throw new Error("Solo las preguntas se arbitran");
    }
    if (item.status === "annulled") {
      throw new Error("La pregunta está anulada: no se arbitra");
    }

    if (!Array.isArray(verdicts)) {
      throw new Error("El arbitraje debe enviarse como lista de veredictos");
    }
    for (const verdict of verdicts) {
      if (!verdict.player) {
        throw new Error("Cada veredicto debe indicar el participante");
      }
      if (
        verdict.isCorrect !== true &&
        verdict.isCorrect !== false &&
        verdict.isCorrect !== null
      ) {
        throw new Error(
          "Cada veredicto debe ser correcto, incorrecto o sin arbitrar",
        );
      }
    }

    await Promise.all(
      verdicts.map((verdict) =>
        ProdePrediction.updateOne(
          {
            matchday: matchdayId,
            player: verdict.player,
            "picks.item": itemId,
          },
          { $set: { "picks.$.isCorrect": verdict.isCorrect } },
        ),
      ),
    );

    return { judged: verdicts.length };
  };

  /* --------------- GET MATCHDAY PARTIALS --------------- */
  /* Parciales al vuelo: mismas guardas de visibilidad que los pronósticos
     ajenos (post-deadline, participante, rezagado bloqueado hasta cerrar). */
  getMatchdayPartials = async (matchdayId, playerId) => {
    const matchday = await getMatchdayForParticipant(matchdayId, playerId);

    if (matchday.phase !== "in_play" && matchday.phase !== "consolidated") {
      throw new Error(
        "Los parciales se muestran recién después del deadline",
      );
    }
    if (isReopenedFor(matchday, playerId)) {
      const error = new Error(
        "Tenés la carga reabierta: vas a ver los parciales cuando guardes y cierres la tuya",
      );
      error.status = 403;
      throw error;
    }

    const predictions = await ProdePrediction.find({ matchday: matchdayId });
    return computeMatchdayPartials(matchday, predictions);
  };

  /* --------------- GET MATCHDAY PARTIALS (admin) --------------- */
  /* Para la vista previa de la consolidación: sin exigir participante */
  getMatchdayPartialsAdmin = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    const predictions = await ProdePrediction.find({ matchday: matchdayId });
    return computeMatchdayPartials(matchday, predictions);
  };
}
