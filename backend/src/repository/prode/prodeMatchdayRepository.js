import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import User from "../../dao/models/userModel.js";
import { PRODE_CHALLENGES } from "../../dao/models/prode/prodeConstants.js";
import {
  promoteExpiredMatchday,
  promoteExpiredMatchdaysForTournament,
} from "./promoteExpiredMatchdays.js";
import { sendBulkEmail } from "../../helpers/sendBulkEmail.js";
import {
  buildProdeEmailHTML,
  formatDeadlineForEmail,
} from "../../helpers/prodeEmailTemplate.js";
import {
  computeMatchdayPartials,
  calcChallengeResult,
  calcDuelOutcome,
} from "../../helpers/prodeScoring.js";

/* Los duelos nacen con los 3 challenges vacíos (scores null): es el mismo
   shape que usan las fechas históricas antes de tener resultados, y lo que
   la consolidación completará al final. */
const buildEmptyChallenges = () =>
  PRODE_CHALLENGES.map((type) => ({
    type,
    scoreA: null,
    scoreB: null,
    result: null,
  }));

const validateDuels = (duels, tournament) => {
  const participantIds = tournament.participants.map(String);
  if (participantIds.length === 0) {
    throw new Error(
      "El torneo no tiene participantes: cargalos antes de armar duelos",
    );
  }

  const expectedDuels = participantIds.length / 2;
  if (duels.length !== expectedDuels) {
    throw new Error(
      `Deben armarse exactamente ${expectedDuels} duelos (${participantIds.length} participantes)`,
    );
  }

  const used = [];
  for (const duel of duels) {
    const a = String(duel.playerA);
    const b = String(duel.playerB);
    if (!duel.playerA || !duel.playerB) {
      throw new Error("Todos los duelos deben tener sus dos jugadores");
    }
    if (a === b) {
      throw new Error("Un duelo no puede enfrentar a un jugador consigo mismo");
    }
    if (!participantIds.includes(a) || !participantIds.includes(b)) {
      throw new Error(
        "Todos los jugadores de los duelos deben ser participantes del torneo",
      );
    }
    used.push(a, b);
  }

  const unique = new Set(used);
  if (unique.size !== used.length) {
    throw new Error("Ningún participante puede estar en más de un duelo");
  }
};

/* El carrito de ítems es solo ARG/MISC: GDT se juega con el fantasy */
const CART_CHALLENGES = PRODE_CHALLENGES.filter((type) => type !== "GDT");

const assertItemsEditable = (matchday) => {
  if (matchday.phase !== "draft" && matchday.phase !== "open") {
    throw new Error(
      "Los ítems solo pueden modificarse mientras la fecha está en borrador o abierta",
    );
  }
};

const isValidPoints = (value) => Number.isInteger(value) && value >= 0;

/* Manda un mail a todos los usuarios vinculados a un participante del torneo
   (el Prode se juega entre participantes). Si algún envío falla, la operación
   que lo disparó sigue en pie y se informan los fallidos. */
const emailTournamentParticipants = async (
  participants,
  subject,
  generateHTML,
) => {
  const participantIds = participants.map((p) => p._id);
  const users = await User.find(
    { prode_player: { $in: participantIds } },
    { first_name: 1, email: 1, prode_player: 1 },
  );

  const linkedPlayerIds = new Set(
    users.map((user) => String(user.prode_player)),
  );
  const participantsWithoutUser = participants
    .filter((p) => !linkedPlayerIds.has(String(p._id)))
    .map((p) => p.name);

  const results = await Promise.allSettled(
    users.map((user) =>
      sendBulkEmail({ recipients: [user], subject, generateHTML }),
    ),
  );
  const failedEmails = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to send prode email to ${users[index].email}:`,
        result.reason,
      );
      failedEmails.push(users[index].email);
    }
  });

  return { failedEmails, participantsWithoutUser };
};

const validateItemFields = (item) => {
  if (!CART_CHALLENGES.includes(item.challenge)) {
    throw new Error(
      "El ítem debe pertenecer a Prode Argentina (ARG) o Prode Resto del Mundo (MISC)",
    );
  }

  if (item.kind === "match") {
    if (!item.homeName?.trim() || !item.awayName?.trim()) {
      throw new Error("El partido debe tener equipo local y visitante");
    }
    if (
      item.homeName.trim().toLowerCase() === item.awayName.trim().toLowerCase()
    ) {
      throw new Error("Local y visitante no pueden ser el mismo equipo");
    }
    if (
      !(item.kickoffAt instanceof Date) ||
      Number.isNaN(item.kickoffAt.getTime())
    ) {
      throw new Error("El kickoff del partido es obligatorio");
    }
    if (
      !isValidPoints(item.pointsHome) ||
      !isValidPoints(item.pointsDraw) ||
      !isValidPoints(item.pointsAway)
    ) {
      throw new Error("Los puntos del partido deben ser enteros de 0 o más");
    }
    return;
  }

  if (item.kind === "question") {
    if (!item.questionText?.trim()) {
      throw new Error("La pregunta no puede estar vacía");
    }
    if (!isValidPoints(item.pointsCorrect)) {
      throw new Error(
        "Los puntos de la pregunta deben ser enteros de 0 o más",
      );
    }
    return;
  }

  throw new Error("El tipo de ítem debe ser partido o pregunta");
};

export default class ProdeMatchdayRepository {
  /* --------------- CREATE PRODE MATCHDAY --------------- */
  createProdeMatchday = async ({
    tournament: tournamentId,
    month,
    roundNumber,
    predictionsDeadline,
  }) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");
    if (tournament.status === "finished") {
      throw new Error("El torneo ya está finalizado");
    }
    if (!tournament.months.includes(month)) {
      throw new Error(`El mes "${month}" no forma parte del torneo`);
    }

    const duplicate = await ProdeMatchday.exists({
      tournament: tournamentId,
      roundNumber,
    });
    if (duplicate) {
      throw new Error(
        `Ya existe la fecha número ${roundNumber} en este torneo`,
      );
    }

    return ProdeMatchday.create({
      tournament: tournamentId,
      month,
      roundNumber,
      predictionsDeadline,
      phase: "draft",
      duels: [],
    });
  };

  /* --------------- GET MATCHDAYS BY TOURNAMENT --------------- */
  getMatchdaysByTournament = async (tournamentId) => {
    await promoteExpiredMatchdaysForTournament(tournamentId);
    return ProdeMatchday.find({ tournament: tournamentId })
      .populate("duels.playerA", "name")
      .populate("duels.playerB", "name")
      .sort({ roundNumber: -1 });
  };

  /* --------------- GET PRODE MATCHDAY BY ID --------------- */
  getProdeMatchdayById = async (matchdayId) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId)
      .populate({
        path: "tournament",
        select: "name year months status participants",
        populate: { path: "participants", select: "name" },
      })
      .populate("duels.playerA", "name")
      .populate("duels.playerB", "name")
      .populate("reopenedFor", "name");
    if (!matchday) throw new Error("Fecha no encontrada");
    return matchday;
  };

  /* --------------- GET PARTICIPANT AVATARS --------------- */
  /* Foto de perfil de cada participante (vía el user vinculado por
     prode_player): { playerId: profile_picture }. El frontend decide si la
     foto es propia o el default y cae a la inicial. */
  getParticipantAvatars = async (matchday) => {
    const participantIds = (matchday.tournament?.participants ?? []).map(
      (p) => p._id ?? p,
    );
    if (participantIds.length === 0) return {};

    const users = await User.find(
      { prode_player: { $in: participantIds } },
      { prode_player: 1, profile_picture: 1 },
    );

    const avatars = {};
    for (const user of users) {
      avatars[String(user.prode_player)] = user.profile_picture ?? "";
    }
    return avatars;
  };

  /* --------------- UPDATE MATCHDAY META --------------- */
  updateProdeMatchdayMeta = async (
    matchdayId,
    { month, roundNumber, predictionsDeadline },
  ) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase === "consolidated") {
      throw new Error("Una fecha consolidada no se puede modificar");
    }

    const tournament = await ProdeTournament.findById(matchday.tournament);

    if (month !== undefined) {
      if (!tournament.months.includes(month)) {
        throw new Error(`El mes "${month}" no forma parte del torneo`);
      }
      matchday.month = month;
    }

    if (roundNumber !== undefined && roundNumber !== matchday.roundNumber) {
      const duplicate = await ProdeMatchday.exists({
        tournament: matchday.tournament,
        roundNumber,
        _id: { $ne: matchdayId },
      });
      if (duplicate) {
        throw new Error(
          `Ya existe la fecha número ${roundNumber} en este torneo`,
        );
      }
      matchday.roundNumber = roundNumber;
    }

    if (predictionsDeadline !== undefined) {
      /* En una fecha en juego el deadline ya no tiene efecto (la fase manda
         y no hay vuelta atrás): editarlo solo confundiría */
      if (matchday.phase === "in_play") {
        throw new Error(
          "El deadline no puede modificarse en una fecha en juego: para habilitar a un rezagado usá Reabrir carga",
        );
      }
      matchday.predictionsDeadline = predictionsDeadline;
    }

    return matchday.save();
  };

  /* --------------- SET MATCHDAY DUELS --------------- */
  setProdeMatchdayDuels = async (matchdayId, duels) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "draft" && matchday.phase !== "open") {
      throw new Error(
        "Los duelos solo pueden modificarse mientras la fecha está en borrador o abierta",
      );
    }

    const tournament = await ProdeTournament.findById(matchday.tournament);
    validateDuels(duels, tournament);

    matchday.duels = duels.map((duel) => ({
      playerA: duel.playerA,
      playerB: duel.playerB,
      challenges: buildEmptyChallenges(),
      duelResult: null,
      points: { playerA: 0, playerB: 0, bonusA: 0, bonusB: 0 },
    }));

    return matchday.save();
  };

  /* --------------- OPEN PRODE MATCHDAY --------------- */
  openProdeMatchday = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId).populate({
      path: "tournament",
      select: "name year participants",
      populate: { path: "participants", select: "name" },
    });
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "draft") {
      throw new Error("Solo una fecha en borrador puede abrirse");
    }
    if (
      !matchday.predictionsDeadline ||
      matchday.predictionsDeadline <= new Date()
    ) {
      throw new Error(
        "El deadline de pronósticos ya pasó: actualizalo antes de abrir la fecha",
      );
    }

    const participants = matchday.tournament?.participants ?? [];
    if (
      participants.length === 0 ||
      matchday.duels.length !== participants.length / 2
    ) {
      throw new Error("Los duelos deben estar armados antes de abrir la fecha");
    }

    const hasArg = matchday.items.some((item) => item.challenge === "ARG");
    const hasMisc = matchday.items.some((item) => item.challenge === "MISC");
    if (!hasArg || !hasMisc) {
      throw new Error(
        "La fecha necesita al menos un ítem en Prode Argentina y otro en Prode Resto del Mundo antes de abrirse",
      );
    }

    matchday.phase = "open";
    await matchday.save();

    const subject = `Fecha ${matchday.roundNumber} del Prode abierta`;
    const deadlineText = formatDeadlineForEmail(matchday.predictionsDeadline);
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#9654;",
        title: `Se abri&oacute; la fecha ${matchday.roundNumber}`,
        bodyHtml: `Hola ${user.first_name}, ya est&aacute; abierta la fecha ${matchday.roundNumber} de ${matchday.tournament.name}. Carg&aacute; tus pron&oacute;sticos antes del <strong style="color:#e8e8e8;">${deadlineText}</strong>.`,
        ctaLabel: "Cargar pron&oacute;sticos",
        ctaUrl: "https://elrincondechacho.com/prode",
      });

    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants(participants, subject, generateHTML);

    return { matchday, failedEmails, participantsWithoutUser };
  };

  /* --------------- CONSOLIDATE MATCHDAY --------------- */
  /* Cierre definitivo de la fecha (siempre manual: hay plata real). Escribe
     los resultados en el shape histórico duels[].challenges — ARG/MISC con
     las sumas del motor de puntaje (idénticas a los parciales) y GDT tipeado
     por el admin como PUENTE hasta la Etapa 4. Fechas nuevas indistinguibles
     de las del Excel. gdtScores: [{scoreA, scoreB}] en el orden de duels. */
  consolidateProdeMatchday = async (matchdayId, gdtScores) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId).populate({
      path: "tournament",
      select: "name year participants",
      populate: { path: "participants", select: "name" },
    });
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Solo una fecha en juego (post-deadline) puede consolidarse",
      );
    }

    /* Todos los ítems resueltos: con resultado o anulados */
    const unresolved = matchday.items.filter(
      (item) => item.status === "scheduled",
    );
    if (unresolved.length > 0) {
      const names = unresolved
        .slice(0, 3)
        .map((item) =>
          item.kind === "match"
            ? `${item.homeName} vs ${item.awayName}`
            : item.questionText,
        )
        .join(", ");
      throw new Error(
        `Faltan resultados en ${unresolved.length} ítem(s): ${names}${
          unresolved.length > 3 ? "..." : ""
        }`,
      );
    }

    /* Todas las respuestas de preguntas arbitradas */
    const predictions = await ProdePrediction.find({ matchday: matchdayId });
    for (const item of matchday.items) {
      if (item.kind !== "question" || item.status === "annulled") continue;
      for (const prediction of predictions) {
        const pick = (prediction.picks ?? []).find(
          (p) => String(p.item) === String(item._id),
        );
        if (pick && (pick.isCorrect === null || pick.isCorrect === undefined)) {
          throw new Error(
            `La pregunta "${item.questionText}" tiene respuestas sin arbitrar`,
          );
        }
      }
    }

    /* GDT tipeado para todos los duelos */
    if (
      !Array.isArray(gdtScores) ||
      gdtScores.length !== matchday.duels.length
    ) {
      throw new Error(
        `Cargá el resultado GDT de los ${matchday.duels.length} duelos`,
      );
    }
    for (const score of gdtScores) {
      if (
        !Number.isInteger(score?.scoreA) ||
        !Number.isInteger(score?.scoreB) ||
        score.scoreA < 0 ||
        score.scoreB < 0
      ) {
        throw new Error(
          "Cada resultado GDT debe tener los dos valores como enteros de 0 o más",
        );
      }
    }

    /* ARG/MISC desde el MISMO motor que alimentó los parciales */
    const { totals } = computeMatchdayPartials(matchday, predictions);

    matchday.duels.forEach((duel, index) => {
      const playerA = String(duel.playerA?._id ?? duel.playerA);
      const playerB = String(duel.playerB?._id ?? duel.playerB);

      for (const challenge of duel.challenges) {
        if (challenge.type === "GDT") {
          challenge.scoreA = gdtScores[index].scoreA;
          challenge.scoreB = gdtScores[index].scoreB;
        } else {
          challenge.scoreA = totals[playerA]?.[challenge.type] ?? 0;
          challenge.scoreB = totals[playerB]?.[challenge.type] ?? 0;
        }
        challenge.result = calcChallengeResult(
          challenge.scoreA,
          challenge.scoreB,
        );
      }

      const outcome = calcDuelOutcome(duel.challenges);
      duel.duelResult = outcome.duelResult;
      duel.points = outcome.points;
    });

    matchday.phase = "consolidated";
    await matchday.save();

    /* Mail de resultados personalizado: cada participante recibe cómo le
       fue en SU duelo */
    const participants = matchday.tournament?.participants ?? [];
    const namesById = {};
    for (const participant of participants) {
      namesById[String(participant._id)] = participant.name;
    }

    const outcomes = {};
    for (const duel of matchday.duels) {
      const playerA = String(duel.playerA?._id ?? duel.playerA);
      const playerB = String(duel.playerB?._id ?? duel.playerB);
      outcomes[playerA] = {
        result:
          duel.duelResult === "A"
            ? "ganaste"
            : duel.duelResult === "draw"
              ? "empataste"
              : "perdiste",
        points: duel.points.playerA + duel.points.bonusA,
        rivalName: namesById[playerB] ?? "tu rival",
      };
      outcomes[playerB] = {
        result:
          duel.duelResult === "B"
            ? "ganaste"
            : duel.duelResult === "draw"
              ? "empataste"
              : "perdiste",
        points: duel.points.playerB + duel.points.bonusB,
        rivalName: namesById[playerA] ?? "tu rival",
      };
    }

    const subject = `Resultados de la fecha ${matchday.roundNumber} del Prode`;
    const generateHTML = (user) => {
      const outcome = outcomes[String(user.prode_player)];
      const duelHtml = outcome
        ? ` En tu duelo contra ${outcome.rivalName} <strong style="color:#e8e8e8;">${outcome.result}</strong> y sumaste <strong style="color:#e8e8e8;">${outcome.points} punto${outcome.points === 1 ? "" : "s"}</strong>.`
        : "";
      return buildProdeEmailHTML({
        iconHtml: "&#9873;",
        title: `Fecha ${matchday.roundNumber} consolidada`,
        bodyHtml: `Hola ${user.first_name}, ya est&aacute;n los resultados definitivos de la fecha ${matchday.roundNumber} de ${matchday.tournament.name}.${duelHtml}`,
        ctaLabel: "Ver resultados",
        ctaUrl: "https://elrincondechacho.com/prode",
      });
    };

    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants(participants, subject, generateHTML);

    return { matchday, failedEmails, participantsWithoutUser };
  };

  /* --------------- SET ITEM RESULT --------------- */
  /* Resultado real de un ítem (fecha en juego): marcador para partidos,
     respuesta oficial para preguntas. Marca el ítem como finished. */
  setProdeMatchdayItemResult = async (matchdayId, itemId, data) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Los resultados se cargan con la fecha en juego (post-deadline)",
      );
    }

    const item = matchday.items.id(itemId);
    if (!item) throw new Error("Ítem no encontrado en la fecha");
    if (item.status === "annulled") {
      throw new Error(
        "El ítem está anulado: restauralo antes de cargarle resultado",
      );
    }

    if (item.kind === "match") {
      const { scoreHome, scoreAway } = data;
      if (
        !Number.isInteger(scoreHome) ||
        !Number.isInteger(scoreAway) ||
        scoreHome < 0 ||
        scoreAway < 0
      ) {
        throw new Error(
          "El resultado del partido debe tener los dos goles como enteros de 0 o más",
        );
      }
      item.scoreHome = scoreHome;
      item.scoreAway = scoreAway;
    } else {
      const officialAnswer = (data.officialAnswer ?? "").trim();
      if (!officialAnswer) {
        throw new Error("La respuesta oficial no puede estar vacía");
      }
      item.officialAnswer = officialAnswer;
    }

    item.status = "finished";
    return matchday.save();
  };

  /* --------------- ANNUL / RESTORE ITEM --------------- */
  /* Partido suspendido/postergado: anulado queda visible pero no otorga
     puntos a nadie. Restaurar vuelve al estado que corresponda según tenga
     resultado cargado o no. */
  annulProdeMatchdayItem = async (matchdayId, itemId, annulled) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Los ítems se anulan o restauran con la fecha en juego",
      );
    }

    const item = matchday.items.id(itemId);
    if (!item) throw new Error("Ítem no encontrado en la fecha");

    if (annulled) {
      item.status = "annulled";
    } else {
      const hasResult =
        item.kind === "match"
          ? item.scoreHome !== null && item.scoreAway !== null
          : Boolean(item.officialAnswer?.trim());
      item.status = hasResult ? "finished" : "scheduled";
    }

    return matchday.save();
  };

  /* --------------- REOPEN MATCHDAY FOR PLAYER --------------- */
  /* Reapertura por rezagado: el admin habilita a UN participante a cargar
     post-deadline. Los partidos con kickoff pasado igual quedan bloqueados
     (lo garantiza el upsert) y su guardado consume la reapertura. */
  reopenProdeMatchdayFor = async (matchdayId, playerId) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Solo se puede reabrir la carga de una fecha en juego (post-deadline)",
      );
    }

    const tournament = await ProdeTournament.findById(matchday.tournament, {
      participants: 1,
    });
    const participantIds = (tournament?.participants ?? []).map(String);
    if (!participantIds.includes(String(playerId))) {
      throw new Error("El jugador no es participante del torneo de esta fecha");
    }

    await ProdeMatchday.updateOne(
      { _id: matchdayId },
      { $addToSet: { reopenedFor: playerId } },
    );

    return this.getProdeMatchdayById(matchdayId);
  };

  /* --------------- NOTIFY MATCHDAY CHANGES --------------- */
  /* Aviso MANUAL del admin a TODOS los participantes cuando editó los ítems
     de una fecha ya abierta (quien cargó temprano no se enteraría solo).
     Manual y no automático: el admin decide qué cambio amerita mail. */
  notifyProdeMatchdayChanges = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId).populate({
      path: "tournament",
      select: "name year participants",
      populate: { path: "participants", select: "name" },
    });
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "open") {
      throw new Error(
        "Solo se pueden notificar cambios de una fecha abierta",
      );
    }

    const participants = matchday.tournament?.participants ?? [];
    if (participants.length === 0) {
      throw new Error("El torneo no tiene participantes cargados");
    }

    const subject = `Cambios en la fecha ${matchday.roundNumber} del Prode`;
    const deadlineText = formatDeadlineForEmail(matchday.predictionsDeadline);
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#9998;",
        title: `Hubo cambios en la fecha ${matchday.roundNumber}`,
        bodyHtml: `Hola ${user.first_name}, se modificaron los partidos o preguntas de la fecha ${matchday.roundNumber} de ${matchday.tournament.name}. Revis&aacute; tus pron&oacute;sticos y complet&aacute; lo que falte antes del <strong style="color:#e8e8e8;">${deadlineText}</strong>.`,
        ctaLabel: "Revisar pron&oacute;sticos",
        ctaUrl: "https://elrincondechacho.com/prode",
      });

    return emailTournamentParticipants(participants, subject, generateHTML);
  };

  /* --------------- ADD MATCHDAY ITEM --------------- */
  addProdeMatchdayItem = async (matchdayId, itemData) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    assertItemsEditable(matchday);

    const item =
      itemData.kind === "match"
        ? {
            challenge: itemData.challenge,
            kind: "match",
            source: "manual",
            leagueName: itemData.leagueName ?? "",
            homeName: itemData.homeName,
            awayName: itemData.awayName,
            kickoffAt: itemData.kickoffAt,
            pointsHome: itemData.pointsHome ?? 5,
            pointsDraw: itemData.pointsDraw ?? 5,
            pointsAway: itemData.pointsAway ?? 5,
          }
        : {
            challenge: itemData.challenge,
            kind: itemData.kind,
            questionText: itemData.questionText,
            pointsCorrect: itemData.pointsCorrect ?? 5,
          };

    validateItemFields(item);
    matchday.items.push(item);
    return matchday.save();
  };

  /* --------------- UPDATE MATCHDAY ITEM --------------- */
  updateProdeMatchdayItem = async (matchdayId, itemId, itemData) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    assertItemsEditable(matchday);

    const item = matchday.items.id(itemId);
    if (!item) throw new Error("Ítem no encontrado en la fecha");
    if (itemData.kind !== undefined && itemData.kind !== item.kind) {
      throw new Error(
        "El tipo de ítem no puede cambiarse: eliminalo y cargá uno nuevo",
      );
    }

    const merged =
      item.kind === "match"
        ? {
            challenge: itemData.challenge ?? item.challenge,
            kind: "match",
            leagueName: itemData.leagueName ?? item.leagueName,
            homeName: itemData.homeName ?? item.homeName,
            awayName: itemData.awayName ?? item.awayName,
            kickoffAt: itemData.kickoffAt ?? item.kickoffAt,
            pointsHome: itemData.pointsHome ?? item.pointsHome,
            pointsDraw: itemData.pointsDraw ?? item.pointsDraw,
            pointsAway: itemData.pointsAway ?? item.pointsAway,
          }
        : {
            challenge: itemData.challenge ?? item.challenge,
            kind: "question",
            questionText: itemData.questionText ?? item.questionText,
            pointsCorrect: itemData.pointsCorrect ?? item.pointsCorrect,
          };

    validateItemFields(merged);
    Object.assign(item, merged);
    return matchday.save();
  };

  /* --------------- DELETE MATCHDAY ITEM --------------- */
  deleteProdeMatchdayItem = async (matchdayId, itemId) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    assertItemsEditable(matchday);

    const item = matchday.items.id(itemId);
    if (!item) throw new Error("Ítem no encontrado en la fecha");

    matchday.items.pull(itemId);
    await matchday.save();

    /* Regla de negocio: ítem quitado descarta los pronósticos ya cargados */
    await ProdePrediction.updateMany(
      { matchday: matchdayId },
      { $pull: { picks: { item: itemId } } },
    );

    return matchday;
  };

  /* --------------- DELETE PRODE MATCHDAY --------------- */
  deleteProdeMatchday = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase === "consolidated") {
      throw new Error(
        "Una fecha consolidada no se puede eliminar: tiene resultados históricos",
      );
    }

    const hasPredictions = await ProdePrediction.exists({
      matchday: matchdayId,
    });
    if (hasPredictions) {
      throw new Error(
        "No se puede eliminar: la fecha ya tiene pronósticos cargados",
      );
    }

    return ProdeMatchday.findByIdAndDelete(matchdayId);
  };
}
