import cron from "node-cron";
import ProdeMatchday from "../dao/models/prode/ProdeMatchdayModel.js";
import ProdePrediction from "../dao/models/prode/ProdePredictionModel.js";
import { emailTournamentParticipants } from "../repository/prode/prodeMatchdayRepository.js";
import { promoteAllExpiredMatchdays } from "../repository/prode/promoteExpiredMatchdays.js";
import {
  buildProdeEmailHTML,
  formatDeadlineForEmail,
} from "../helpers/prodeEmailTemplate.js";

const HOUR_MS = 60 * 60 * 1000;

/* Recordatorios de deadline del Prode (decisión del dueño 2026-07-07):
   uno 24 hs antes y otro 3 hs antes del cierre, SOLO a los participantes
   con ítems sin pronosticar — quien ya completó la fecha no recibe nada.

   Cada envío queda marcado en la fecha (reminder24SentAt / reminder3SentAt),
   así una corrida siguiente o un reinicio del proceso nunca lo duplica.
   La marca se persiste ANTES de mandar: preferimos perder un recordatorio
   ante una falla puntual de SES que spamear con duplicados. */

/* Un pick guardado siempre está completo (el server rechaza parciales),
   así que faltantes = ítems de la fecha - picks guardados. */
const findPendingParticipants = async (matchday) => {
  const predictions = await ProdePrediction.find(
    { matchday: matchday._id },
    { player: 1, picks: 1 },
  );
  const picksByPlayer = {};
  for (const prediction of predictions) {
    picksByPlayer[String(prediction.player)] = (prediction.picks ?? []).length;
  }

  const totalItems = matchday.items.length;
  const missingByPlayer = {};
  const pendingParticipants = [];
  for (const participant of matchday.tournament?.participants ?? []) {
    const missing = totalItems - (picksByPlayer[String(participant._id)] ?? 0);
    if (missing > 0) {
      missingByPlayer[String(participant._id)] = missing;
      pendingParticipants.push(participant);
    }
  }

  return { pendingParticipants, missingByPlayer, totalItems };
};

const sendReminder = async (matchday, { urgent }) => {
  const { pendingParticipants, missingByPlayer, totalItems } =
    await findPendingParticipants(matchday);
  if (pendingParticipants.length === 0) return;

  const deadlineText = formatDeadlineForEmail(matchday.predictionsDeadline);
  const subject = urgent
    ? `Últimas horas: la fecha ${matchday.roundNumber} del Prode cierra hoy`
    : `La fecha ${matchday.roundNumber} del Prode cierra pronto`;

  const generateHTML = (user) => {
    const missing = missingByPlayer[String(user.prode_player)] ?? 0;
    const missingText =
      missing >= totalItems
        ? "todav&iacute;a no cargaste ning&uacute;n pron&oacute;stico"
        : missing === 1
          ? "te queda 1 &iacute;tem sin pronosticar"
          : `te quedan ${missing} &iacute;tems sin pronosticar`;
    return buildProdeEmailHTML({
      iconHtml: "&#8987;",
      title: urgent
        ? `&Uacute;ltimas horas para la fecha ${matchday.roundNumber}`
        : `Se acerca el cierre de la fecha ${matchday.roundNumber}`,
      bodyHtml: `Hola ${user.first_name}, ${missingText} en la fecha ${matchday.roundNumber} de ${matchday.tournament.name}. Ten&eacute;s tiempo hasta el <strong style="color:#e8e8e8;">${deadlineText}</strong>.`,
      ctaLabel: "Cargar pron&oacute;sticos",
      ctaUrl: "https://elrincondechacho.com/prode",
    });
  };

  const { failedEmails } = await emailTournamentParticipants(
    pendingParticipants,
    subject,
    generateHTML,
  );
  if (failedEmails.length > 0) {
    console.error(
      `Prode reminder (fecha ${matchday.roundNumber}): fallaron ${failedEmails.length} mails`,
      failedEmails,
    );
  }
};

export const runProdeDeadlineReminders = async () => {
  const now = new Date();
  const matchdays = await ProdeMatchday.find({
    phase: "open",
    predictionsDeadline: { $gt: now },
    $or: [{ reminder24SentAt: null }, { reminder3SentAt: null }],
  }).populate({
    path: "tournament",
    select: "name participants",
    populate: { path: "participants", select: "name" },
  });

  for (const matchday of matchdays) {
    const msLeft = matchday.predictionsDeadline.getTime() - now.getTime();

    /* Si la fecha se abrió con el deadline ya a menos de 3 hs, va un solo
       mail (el urgente) y se marcan las dos ventanas juntas */
    if (msLeft <= 3 * HOUR_MS && !matchday.reminder3SentAt) {
      matchday.reminder3SentAt = now;
      if (!matchday.reminder24SentAt) matchday.reminder24SentAt = now;
      await matchday.save();
      await sendReminder(matchday, { urgent: true });
    } else if (msLeft <= 24 * HOUR_MS && !matchday.reminder24SentAt) {
      matchday.reminder24SentAt = now;
      await matchday.save();
      await sendReminder(matchday, { urgent: false });
    }
  }
};

/* --------------- AVISO DE CIERRE DE FECHA --------------- */
/* "Cerró la fecha: los pronósticos de todos ya están visibles" — a TODOS
   los participantes del torneo, con el rival del duelo personalizado.
   La fase puede haber cambiado por el barrido de acá o por una lectura
   perezosa: la marca closedNoticeSentAt (persistida ANTES de enviar, como
   los recordatorios) garantiza un solo mail sea cual sea el camino. */
const sendClosedNotice = async (matchday) => {
  const participants = matchday.tournament?.participants ?? [];
  if (participants.length === 0) return;

  const nameById = new Map(
    participants.map((p) => [String(p._id), p.name]),
  );
  const rivalByPlayer = {};
  for (const duel of matchday.duels ?? []) {
    const a = String(duel.playerA);
    const b = String(duel.playerB);
    rivalByPlayer[a] = nameById.get(b) ?? null;
    rivalByPlayer[b] = nameById.get(a) ?? null;
  }

  const subject = `Cerró la fecha ${matchday.roundNumber} del Prode: los pronósticos ya están visibles`;

  const generateHTML = (user) => {
    const rival = rivalByPlayer[String(user.prode_player)];
    const duelHtml = rival
      ? ` Tu duelo de la fecha: <strong style="color:#e8e8e8;">vos vs ${rival}</strong>.`
      : "";
    return buildProdeEmailHTML({
      iconHtml: "&#128064;",
      title: `Cerr&oacute; la fecha ${matchday.roundNumber}`,
      bodyHtml: `Hola ${user.first_name}, la carga de la fecha ${matchday.roundNumber} de ${matchday.tournament.name} termin&oacute;: la fecha est&aacute; en juego y los pron&oacute;sticos de todos ya est&aacute;n visibles.${duelHtml}`,
      ctaLabel: "Ver la fecha en vivo",
      ctaUrl: `https://elrincondechacho.com/prode/fecha/${matchday._id}`,
    });
  };

  const { failedEmails } = await emailTournamentParticipants(
    participants,
    subject,
    generateHTML,
  );
  if (failedEmails.length > 0) {
    console.error(
      `Prode closed notice (fecha ${matchday.roundNumber}): fallaron ${failedEmails.length} mails`,
      failedEmails,
    );
  }
};

export const runProdeClosedNotices = async () => {
  /* Primero el barrido: una fecha recién vencida pasa a en juego y recibe
     su aviso en el mismo tick, sin depender de que alguien la lea */
  await promoteAllExpiredMatchdays();

  const matchdays = await ProdeMatchday.find({
    phase: "in_play",
    closedNoticeSentAt: null,
  }).populate({
    path: "tournament",
    select: "name participants",
    populate: { path: "participants", select: "name" },
  });

  for (const matchday of matchdays) {
    matchday.closedNoticeSentAt = new Date();
    await matchday.save();
    await sendClosedNotice(matchday);
  }
};

const runAll = async () => {
  await runProdeDeadlineReminders();
  await runProdeClosedNotices();
};

export const startProdeDeadlineReminders = () => {
  cron.schedule("*/15 * * * *", () => {
    runAll().catch((error) => {
      console.error("Prode deadline reminders cron failed:", error);
    });
  });

  /* Corrida inmediata al bootear: cubre la ventana que un reinicio de PM2
     cerca de un deadline podría dejar sin recordar */
  runAll().catch((error) => {
    console.error("Prode deadline reminders startup run failed:", error);
  });
};
