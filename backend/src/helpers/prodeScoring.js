import { EXACT_SCORE_BONUS } from "../dao/models/prode/prodeConstants.js";

/* Motor de puntaje ARG/MISC del Prode. Es la ÚNICA fuente de cálculo:
   los parciales al vuelo (1.7) y la consolidación definitiva (1.8) usan
   estas mismas funciones, así nunca pueden diferir.

   Reglas de negocio:
   - Partido: el pick 1X2 y el marcador exacto se evalúan por separado
     (puede cobrarse uno, el otro, ambos o ninguno). Acertar el 1X2 vale los
     puntos configurados del resultado (pointsHome/Draw/Away); el marcador
     exacto suma SIEMPRE el bonus fijo de 5.
   - Pregunta: la arbitra el admin (isCorrect por participante).
   - Ítem anulado: 0 puntos para todos, ni pick ni bonus.
   - Ítem sin resultado/arbitraje: pendiente (no suma ni resta). */

/* ---------- Fórmula del duelo (recuperada del sistema histórico:
   prodeController.updateProdeMatchdayFull, verificada contra git) ---------- */

/* Resultado de un desafío por score directo */
export const calcChallengeResult = (scoreA, scoreB) => {
  if (scoreA > scoreB) return "A";
  if (scoreB > scoreA) return "B";
  return "draw";
};

/* Resultado y puntos del duelo a partir de sus 3 challenges con result:
   - duelResult por suma PONDERADA (GDT pesa 2, ARG/MISC pesan 1; los
     empates de desafío no suman para nadie)
   - puntos: ganador 3 / empate 1-1 / perdedor 0
   - bonus +1 SOLO por barrida real: ganar los 3 desafíos (los empates
     no cuentan como ganados) */
export const calcDuelOutcome = (challenges) => {
  let weightedA = 0;
  let weightedB = 0;
  let winsA = 0;
  let winsB = 0;

  for (const challenge of challenges) {
    const weight = challenge.type === "GDT" ? 2 : 1;
    if (challenge.result === "A") {
      weightedA += weight;
      winsA += 1;
    } else if (challenge.result === "B") {
      weightedB += weight;
      winsB += 1;
    }
  }

  const duelResult =
    weightedA > weightedB ? "A" : weightedB > weightedA ? "B" : "draw";

  return {
    duelResult,
    points: {
      playerA: duelResult === "A" ? 3 : duelResult === "draw" ? 1 : 0,
      playerB: duelResult === "B" ? 3 : duelResult === "draw" ? 1 : 0,
      bonusA: winsA === 3 ? 1 : 0,
      bonusB: winsB === 3 ? 1 : 0,
    },
  };
};

/* Puntos de UN pick contra UN ítem.
   Devuelve { scored: bool, points: number }:
   - scored=false → el ítem todavía no puntúa (sin resultado / sin arbitrar)
   - scored=true  → points es definitivo para el estado actual del ítem */
export const scorePick = (item, pick) => {
  if (item.status === "annulled") {
    return { scored: true, points: 0 };
  }

  if (item.kind === "match") {
    if (
      item.status !== "finished" ||
      item.scoreHome === null ||
      item.scoreAway === null
    ) {
      return { scored: false, points: 0 };
    }
    if (!pick) return { scored: true, points: 0 };

    const outcome =
      item.scoreHome > item.scoreAway
        ? "home"
        : item.scoreHome < item.scoreAway
          ? "away"
          : "draw";

    let points = 0;
    if (pick.pick1x2 === outcome) {
      points +=
        outcome === "home"
          ? item.pointsHome
          : outcome === "draw"
            ? item.pointsDraw
            : item.pointsAway;
    }
    if (
      pick.predictedHome === item.scoreHome &&
      pick.predictedAway === item.scoreAway &&
      pick.predictedHome !== null &&
      pick.predictedAway !== null
    ) {
      points += EXACT_SCORE_BONUS;
    }
    return { scored: true, points };
  }

  /* kind: "question" — puntúa recién cuando el admin arbitró ESTE pick */
  if (!pick || pick.isCorrect === null || pick.isCorrect === undefined) {
    return { scored: false, points: 0 };
  }
  return { scored: true, points: pick.isCorrect ? item.pointsCorrect : 0 };
};

/* Parciales de una fecha completa.
   matchday: doc con items y duels; predictions: docs de ProdePrediction.
   Devuelve:
   - picks:  { playerId: { itemId: { scored, points } } }
   - totals: { playerId: { ARG, MISC, total } }
   - duels:  [{ playerA, playerB, challenges: { ARG: {a,b}, MISC: {a,b} } }] */
export const computeMatchdayPartials = (matchday, predictions) => {
  const picksByPlayer = {};
  for (const prediction of predictions) {
    const playerId = String(prediction.player?._id ?? prediction.player);
    picksByPlayer[playerId] = {};
    for (const pick of prediction.picks ?? []) {
      picksByPlayer[playerId][String(pick.item)] = pick;
    }
  }

  const playerIds = Object.keys(picksByPlayer);
  /* Los duelos pueden incluir participantes que nunca cargaron nada:
     también deben aparecer con 0 */
  for (const duel of matchday.duels ?? []) {
    for (const side of ["playerA", "playerB"]) {
      const playerId = String(duel[side]?._id ?? duel[side]);
      if (!playerIds.includes(playerId)) {
        playerIds.push(playerId);
        picksByPlayer[playerId] = {};
      }
    }
  }

  const picks = {};
  const totals = {};
  for (const playerId of playerIds) {
    picks[playerId] = {};
    totals[playerId] = { ARG: 0, MISC: 0, total: 0 };

    for (const item of matchday.items ?? []) {
      const itemId = String(item._id);
      const result = scorePick(item, picksByPlayer[playerId][itemId]);
      picks[playerId][itemId] = result;
      if (result.scored) {
        totals[playerId][item.challenge] += result.points;
        totals[playerId].total += result.points;
      }
    }
  }

  const duels = (matchday.duels ?? []).map((duel) => {
    const a = String(duel.playerA?._id ?? duel.playerA);
    const b = String(duel.playerB?._id ?? duel.playerB);
    return {
      playerA: a,
      playerB: b,
      challenges: {
        ARG: { a: totals[a]?.ARG ?? 0, b: totals[b]?.ARG ?? 0 },
        MISC: { a: totals[a]?.MISC ?? 0, b: totals[b]?.MISC ?? 0 },
      },
    };
  });

  return { picks, totals, duels };
};

/* ---------- GDT: mini-duelos slot vs slot (Etapa 4.5) ---------- */

/* Mapa realPlayerId → puntaje desde matchday.gdtScores */
export const gdtScoresMap = (gdtScores) => {
  const map = {};
  for (const score of gdtScores ?? []) {
    map[String(score.realPlayer?._id ?? score.realPlayer)] = score.points;
  }
  return map;
};

/* Valor de un slot en su mini-duelo:
   - slot BLOQUEADO por el admin → 0 SIEMPRE (sanción por conflicto de club
     sobrevenido; determinado aunque no tenga puntaje cargado)
   - puntaje cargado → ese número
   - sin puntaje → null = PENDIENTE en los parciales; con final=true
     (consolidación) vale 0: "no jugó". El admin que quiera resolver un
     mini-duelo en el parcial carga el 0 explícito. */
export const gdtSlotValue = (slot, scoresByPlayer, { final = false } = {}) => {
  if (!slot) return final ? 0 : null;
  if (slot.blocked) return 0;
  const points = scoresByPlayer[String(slot.realPlayer?._id ?? slot.realPlayer)];
  if (points === null || points === undefined) return final ? 0 : null;
  return points;
};

/* Desafío GDT de un duelo: 11 mini-duelos slot contra slot (arquero vs
   arquero, DEF1 vs DEF1, ...). Regla canónica de parciales: un mini-duelo se
   computa SOLO cuando ambos slots tienen valor determinado; empate de
   puntaje = no lo gana nadie (pero cuenta como definido). El score del
   desafío es la cantidad de mini-duelos GANADOS por cada lado.
   Devuelve { miniDuels: [{slotNumber, a, b, result}], a, b, pending }. */
export const computeGdtDuel = (
  slotsA,
  slotsB,
  scoresByPlayer,
  { final = false } = {},
) => {
  const bySlotNumber = (slots) => {
    const map = {};
    for (const slot of slots ?? []) map[slot.slotNumber] = slot;
    return map;
  };
  const mapA = bySlotNumber(slotsA);
  const mapB = bySlotNumber(slotsB);

  const miniDuels = [];
  let winsA = 0;
  let winsB = 0;
  let pending = 0;

  for (let slotNumber = 1; slotNumber <= 11; slotNumber++) {
    const a = gdtSlotValue(mapA[slotNumber], scoresByPlayer, { final });
    const b = gdtSlotValue(mapB[slotNumber], scoresByPlayer, { final });

    let result = null;
    if (a !== null && b !== null) {
      result = a > b ? "A" : b > a ? "B" : "draw";
      if (result === "A") winsA += 1;
      else if (result === "B") winsB += 1;
    } else {
      pending += 1;
    }
    miniDuels.push({ slotNumber, a, b, result });
  }

  return { miniDuels, a: winsA, b: winsB, pending };
};
