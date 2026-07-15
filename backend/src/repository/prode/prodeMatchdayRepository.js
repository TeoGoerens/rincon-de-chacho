import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdePrediction from "../../dao/models/prode/ProdePredictionModel.js";
import GdtUniverse from "../../dao/models/prode/GdtUniverseModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import GdtRealPlayer from "../../dao/models/prode/GdtRealPlayerModel.js";
import User from "../../dao/models/userModel.js";
import {
  PRODE_CHALLENGES,
  GDT_POSITIONS,
  GDT_SLOT_LAYOUT,
} from "../../dao/models/prode/prodeConstants.js";
import {
  promoteExpiredMatchday,
  promoteExpiredMatchdaysForTournament,
} from "./promoteExpiredMatchdays.js";
import {
  monthIndexOf,
  latestSquadsByPlayer,
} from "./gdtSquadVersioning.js";
import { sendBulkEmail } from "../../helpers/sendBulkEmail.js";
import {
  buildProdeEmailHTML,
  formatDeadlineForEmail,
} from "../../helpers/prodeEmailTemplate.js";
import {
  computeMatchdayPartials,
  calcChallengeResult,
  calcDuelOutcome,
  computeGdtDuel,
  gdtScoresMap,
} from "../../helpers/prodeScoring.js";
import {
  getUpcomingEventsByLeague,
  getEventResult,
} from "../../integrations/sportsProvider/index.js";

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

/* El universo GDT de la fecha es opcional (torneos sin GDT siguen andando),
   pero si viene debe ser un universo DEL MISMO torneo y con el DRAFT CERRADO
   (regla del dueño: no se juega una fecha con planteles sin definir).
   currentId permite conservar el universo ya asignado sin re-validar. */
const validateGdtUniverseForTournament = async (
  gdtUniverseId,
  tournamentId,
  currentId = null,
) => {
  if (!gdtUniverseId) return null;
  if (currentId && String(gdtUniverseId) === String(currentId)) {
    return currentId;
  }
  const gdtUniverse = await GdtUniverse.findById(gdtUniverseId);
  if (!gdtUniverse) throw new Error("Universo GDT no encontrado");
  if (String(gdtUniverse.tournament) !== String(tournamentId)) {
    throw new Error("El universo GDT no pertenece al torneo de esta fecha");
  }
  if (gdtUniverse.draftStatus !== "final") {
    throw new Error(
      "El draft de ese universo GDT todavía no está cerrado: no puede asignarse a una fecha",
    );
  }
  return gdtUniverse._id;
};

/* Planteles con los que se juega una fecha: para cada participante, la
   versión vigente AL MES de la fecha (la exacta del mes → si no existe, la
   más reciente anterior → la base del draft, month null). Point-in-time:
   las ventanas de meses posteriores no alteran una fecha ya jugada.
   Devuelve el mapa playerId → squad (slots.realPlayer populado). */
const squadsForMatchdayMonth = async (matchday, months) => {
  const matchdayIndex = monthIndexOf(months, matchday.month);
  const universeId = matchday.gdtUniverse?._id ?? matchday.gdtUniverse;

  const allSquads = await GdtSquad.find(
    { gdtUniverse: universeId },
    { player: 1, month: 1, slots: 1 },
  ).populate("slots.realPlayer", "name club position photoUrl");

  const upToMonth = allSquads.filter(
    (squad) => monthIndexOf(months, squad.month) <= matchdayIndex,
  );
  return latestSquadsByPlayer(upToMonth, months);
};

/* Estado GDT completo de una fecha — COMPARTIDO entre el tablero del admin
   y los parciales del participante (mismo motor, nunca difieren):
   - players: jugadores de los planteles del mes, deduplicados, ordenados
     por club y adentro ARQ→DEF→VOL→DEL, con su puntaje cargado
   - duels: por duelo (ids), score parcial {a,b,pending}, finalScore
     proyectado (sin puntaje = 0) y los 11 mini-duelos slot a slot
   - missingScores: los que bloquean la consolidación
   Devuelve null si la fecha no tiene universo GDT (históricas). Acepta
   matchday con o sin tournament populado. */
const computeMatchdayGdt = async (matchday) => {
  if (!matchday.gdtUniverse) return null;

  let months = matchday.tournament?.months;
  if (!months) {
    const tournament = await ProdeTournament.findById(
      matchday.tournament?._id ?? matchday.tournament,
      { months: 1 },
    );
    months = tournament?.months ?? [];
  }

  const squadByPlayer = await squadsForMatchdayMonth(matchday, months);
  const gdtPoints = gdtScoresMap(matchday.gdtScores);

  /* Jugadores deduplicados (los compartidos aparecen una sola vez: el
     puntaje es del jugador real, no del plantel) */
  const playersById = new Map();
  for (const squad of squadByPlayer.values()) {
    for (const slot of squad.slots ?? []) {
      const realPlayer = slot.realPlayer;
      const playerId = String(realPlayer?._id ?? realPlayer);
      const existing = playersById.get(playerId);
      if (existing) {
        existing.squadCount += 1;
      } else {
        playersById.set(playerId, {
          _id: playerId,
          name: realPlayer?.name ?? "?",
          club: realPlayer?.club ?? "",
          position: realPlayer?.position ?? null,
          photoUrl: realPlayer?.photoUrl ?? "",
          squadCount: 1,
          points: gdtPoints[playerId] ?? null,
        });
      }
    }
  }
  /* Orden pedido por el dueño (2026-07-10): por club, y dentro del club
     arquero → defensores → volantes → delanteros (como lee el diario) */
  const positionOrder = (position) => {
    const index = GDT_POSITIONS.indexOf(position);
    return index === -1 ? GDT_POSITIONS.length : index;
  };
  const players = [...playersById.values()].sort(
    (a, b) =>
      a.club.localeCompare(b.club) ||
      positionOrder(a.position) - positionOrder(b.position) ||
      a.name.localeCompare(b.name),
  );

  const slotSide = (squad, slotNumber) => {
    const slot = (squad?.slots ?? []).find((s) => s.slotNumber === slotNumber);
    if (!slot) return null;
    const playerId = String(slot.realPlayer?._id ?? slot.realPlayer);
    return {
      playerName: slot.realPlayer?.name ?? "?",
      club: slot.realPlayer?.club ?? "",
      photoUrl: slot.realPlayer?.photoUrl ?? "",
      blocked: slot.blocked === true,
      points: gdtPoints[playerId] ?? null,
    };
  };

  const duels = (matchday.duels ?? []).map((duel) => {
    const playerA = String(duel.playerA?._id ?? duel.playerA);
    const playerB = String(duel.playerB?._id ?? duel.playerB);
    const squadA = squadByPlayer.get(playerA);
    const squadB = squadByPlayer.get(playerB);

    const partial = computeGdtDuel(squadA?.slots, squadB?.slots, gdtPoints);
    const projected = computeGdtDuel(squadA?.slots, squadB?.slots, gdtPoints, {
      final: true,
    });

    return {
      playerA,
      playerB,
      score: { a: partial.a, b: partial.b, pending: partial.pending },
      finalScore: { a: projected.a, b: projected.b },
      miniDuels: partial.miniDuels.map((miniDuel) => ({
        slotNumber: miniDuel.slotNumber,
        position: GDT_SLOT_LAYOUT[miniDuel.slotNumber - 1],
        result: miniDuel.result,
        /* value = valor EFECTIVO en el mini-duelo (bloqueado→0, sin
           puntaje→null); points = el puntaje crudo cargado */
        a: { ...slotSide(squadA, miniDuel.slotNumber), value: miniDuel.a },
        b: { ...slotSide(squadB, miniDuel.slotNumber), value: miniDuel.b },
      })),
    };
  });

  return { players, duels, missingScores: missingGdtScores(squadByPlayer, gdtPoints) };
};

/* Parciales GDT para el participante (los usa prodePredictionRepository):
   sin la lista de jugadores ni los faltantes — solo los duelos */
export const getMatchdayGdtPartials = async (matchday) => {
  const gdt = await computeMatchdayGdt(matchday);
  return gdt ? { duels: gdt.duels } : null;
};

/* Jugadores que NECESITAN puntaje para poder consolidar: los que ocupan
   algún slot NO bloqueado y todavía no lo tienen cargado (un bloqueado vale
   0 siempre, con o sin puntaje). Regla del dueño (2026-07-10): la fecha no
   se consolida con puntajes GDT faltantes — el 0 del que no jugó se carga
   explícito. */
const missingGdtScores = (squadByPlayer, gdtPoints) => {
  const missingById = new Map();
  for (const squad of squadByPlayer.values()) {
    for (const slot of squad.slots ?? []) {
      if (slot.blocked) continue;
      const playerId = String(slot.realPlayer?._id ?? slot.realPlayer);
      if (gdtPoints[playerId] !== undefined) continue;
      if (!missingById.has(playerId)) {
        missingById.set(playerId, {
          _id: playerId,
          name: slot.realPlayer?.name ?? "?",
          club: slot.realPlayer?.club ?? "",
        });
      }
    }
  }
  return [...missingById.values()];
};

/* Manda un mail a todos los usuarios vinculados a un participante del torneo
   (el Prode se juega entre participantes). Si algún envío falla, la operación
   que lo disparó sigue en pie y se informan los fallidos. Exportado porque
   también lo usa el cron de recordatorios de deadline. */
export const emailTournamentParticipants = async (
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
    gdtUniverse,
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

    /* Regla del dueño (ajustada 2026-07-09): el universo GDT es OPCIONAL
       hasta el deadline — la fecha se puede crear y hasta ABRIR sin él,
       para que el draft GDT y los pronósticos corran en simultáneo. El
       candado está en la promoción a en juego: una fecha sin universo no
       pasa de abierta (ver promoteExpiredMatchdays). */
    const gdtUniverseId = await validateGdtUniverseForTournament(
      gdtUniverse,
      tournamentId,
    );

    return ProdeMatchday.create({
      tournament: tournamentId,
      month,
      roundNumber,
      predictionsDeadline,
      gdtUniverse: gdtUniverseId,
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
      .populate("reopenedFor", "name")
      .populate("gdtUniverse", "label league isPrimary");
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
    { month, roundNumber, predictionsDeadline, gdtUniverse },
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

    if (gdtUniverse !== undefined) {
      /* El universo con el que se juega se decide antes del deadline */
      if (matchday.phase === "in_play") {
        throw new Error(
          "El universo GDT no puede cambiarse en una fecha en juego",
        );
      }
      /* En borrador y abierta el universo puede asignarse, cambiarse o
         quitarse libremente: el candado real es la promoción a en juego,
         que no ocurre sin universo (ver promoteExpiredMatchdays) */
      matchday.gdtUniverse = await validateGdtUniverseForTournament(
        gdtUniverse,
        matchday.tournament,
        matchday.gdtUniverse,
      );
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
     las sumas del motor de puntaje (idénticas a los parciales) y GDT
     calculado con los mini-duelos slot vs slot (4.5, retiró el puente
     tipeado de 1.8). Exige la carga COMPLETA: todos los ítems resueltos,
     todas las preguntas arbitradas y todos los jugadores GDT de slots no
     bloqueados con puntaje (el 0 del que no jugó se carga explícito).
     Fechas nuevas indistinguibles de las del Excel. */
  consolidateProdeMatchday = async (matchdayId) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId).populate({
      path: "tournament",
      select: "name year participants months",
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

    /* GDT desde los mini-duelos: exige universo (toda fecha llega a en juego
       con universo asignado desde 4.2; las históricas ya están consolidadas) */
    if (!matchday.gdtUniverse) {
      throw new Error(
        "La fecha no tiene universo GDT asignado: no puede consolidarse",
      );
    }
    const squadByPlayer = await squadsForMatchdayMonth(
      matchday,
      matchday.tournament?.months ?? [],
    );
    const gdtPoints = gdtScoresMap(matchday.gdtScores);

    /* Todos los jugadores GDT de la fecha con puntaje (regla del dueño):
       nada se resuelve por omisión, el 0 del que no jugó se carga explícito */
    const missing = missingGdtScores(squadByPlayer, gdtPoints);
    if (missing.length > 0) {
      const names = missing
        .slice(0, 3)
        .map((player) => player.name)
        .join(", ");
      throw new Error(
        `Faltan puntajes GDT de ${missing.length} jugador(es): ${names}${
          missing.length > 3 ? "..." : ""
        } — cargá 0 si no jugó`,
      );
    }

    /* ARG/MISC desde el MISMO motor que alimentó los parciales */
    const { totals } = computeMatchdayPartials(matchday, predictions);

    matchday.duels.forEach((duel) => {
      const playerA = String(duel.playerA?._id ?? duel.playerA);
      const playerB = String(duel.playerB?._id ?? duel.playerB);

      /* final=true: sin puntaje = 0 ("no jugó"); bloqueado = 0 */
      const gdtOutcome = computeGdtDuel(
        squadByPlayer.get(playerA)?.slots,
        squadByPlayer.get(playerB)?.slots,
        gdtPoints,
        { final: true },
      );

      for (const challenge of duel.challenges) {
        if (challenge.type === "GDT") {
          challenge.scoreA = gdtOutcome.a;
          challenge.scoreB = gdtOutcome.b;
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

  /* --------------- REOPEN CONSOLIDATED MATCHDAY --------------- */
  /* Válvula de corrección (pedido del dueño 2026-07-10): una fecha
     consolidada vuelve a "en juego" para corregir resultados, arbitraje o
     puntajes GDT, y consolidarse de nuevo (la re-consolidación recalcula
     todo desde el motor y vuelve a mandar el mail de resultados). Solo
     fechas del rebuild: las históricas del Excel (sin universo GDT) no se
     tocan — reabrirlas las dejaría trabadas, porque la consolidación exige
     universo y en juego el universo no se puede asignar. */
  reopenConsolidatedProdeMatchday = async (matchdayId) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "consolidated") {
      throw new Error("Solo una fecha consolidada puede reabrirse");
    }
    if (!matchday.gdtUniverse) {
      throw new Error(
        "Las fechas históricas (sin universo GDT) no pueden reabrirse",
      );
    }
    matchday.phase = "in_play";
    /* Una consolidada pre-aviso-de-cierre no tiene la marca: se sella acá
       para que el cron no la confunda con una fecha recién cerrada y mande
       el mail de "pronósticos visibles" fuera de contexto */
    if (!matchday.closedNoticeSentAt) {
      matchday.closedNoticeSentAt = new Date();
    }
    return matchday.save();
  };

  /* --------------- SET GDT SCORES --------------- */
  /* Carga PROGRESIVA de puntajes GDT (fecha en juego): un número final por
     jugador real (diario + bonus ya sumados), replicado a todos los
     planteles que lo tengan. Reemplaza el set completo con lo que viene en
     pantalla: sacar un puntaje = vuelve a pendiente. */
  setProdeMatchdayGdtScores = async (matchdayId, scores) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Los puntajes GDT se cargan con la fecha en juego (post-deadline)",
      );
    }
    if (!matchday.gdtUniverse) {
      throw new Error("La fecha no tiene universo GDT asignado");
    }

    if (!Array.isArray(scores)) {
      throw new Error("Formato de puntajes inválido");
    }
    const seen = new Set();
    for (const score of scores) {
      const playerId = String(score?.realPlayer ?? "");
      if (!playerId) throw new Error("Falta el jugador de un puntaje");
      if (seen.has(playerId)) {
        throw new Error("Hay un jugador con más de un puntaje cargado");
      }
      seen.add(playerId);
      if (!Number.isInteger(score?.points) || score.points < 0) {
        throw new Error(
          "Cada puntaje debe ser un número entero de 0 o más",
        );
      }
    }

    /* Los jugadores deben existir en el universo de la fecha (la pantalla
       solo ofrece los de planteles, pero el server no confía en el browser) */
    if (scores.length > 0) {
      const validCount = await GdtRealPlayer.countDocuments({
        _id: { $in: [...seen] },
        gdtUniverse: matchday.gdtUniverse,
      });
      if (validCount !== seen.size) {
        throw new Error(
          "Hay puntajes de jugadores que no pertenecen al universo de la fecha",
        );
      }
    }

    matchday.gdtScores = scores.map((score) => ({
      realPlayer: score.realPlayer,
      points: score.points,
    }));
    return matchday.save();
  };

  /* --------------- GDT BOARD --------------- */
  /* Tablero GDT de la fecha para el admin (en juego o consolidada): los
     jugadores de los planteles del MES de la fecha con su puntaje cargado,
     y los mini-duelos slot vs slot de cada duelo computados con la regla
     canónica de parciales (pendiente hasta que ambos slots estén
     determinados). También devuelve el resultado final proyectado (sin
     puntaje = 0) para la vista previa de consolidación. */
  getProdeMatchdayGdtBoard = async (matchdayId) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId)
      .populate({
        path: "tournament",
        select: "name months participants",
        populate: { path: "participants", select: "name" },
      })
      .populate("gdtUniverse", "label league");
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play" && matchday.phase !== "consolidated") {
      throw new Error(
        "El tablero GDT está disponible con la fecha en juego o consolidada",
      );
    }
    if (!matchday.gdtUniverse) {
      throw new Error("La fecha no tiene universo GDT asignado");
    }

    /* Todo el cálculo vive en computeMatchdayGdt (compartido con los
       parciales del participante); acá solo se suman los nombres */
    const gdt = await computeMatchdayGdt(matchday);

    const namesById = {};
    for (const participant of matchday.tournament?.participants ?? []) {
      namesById[String(participant._id)] = participant.name;
    }

    const players = gdt.players;
    const duels = gdt.duels.map((duel) => ({
      ...duel,
      playerA: { _id: duel.playerA, name: namesById[duel.playerA] ?? "?" },
      playerB: { _id: duel.playerB, name: namesById[duel.playerB] ?? "?" },
    }));

    return {
      universe: matchday.gdtUniverse,
      month: matchday.month,
      phase: matchday.phase,
      players,
      duels,
      /* Los que bloquean la consolidación (slots no bloqueados sin puntaje) */
      missingScores: gdt.missingScores,
    };
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

  /* --------------- REFRESH CATALOG RESULTS --------------- */
  /* Trae del proveedor los resultados de los partidos del catálogo que
     siguen sin resultado (fecha en juego). Solo escribe marcadores de
     partidos TERMINADOS: uno en juego se descarta y se volverá a consultar
     en el próximo refresh. Nunca pisa un resultado ya cargado (la
     corrección manual le gana al proveedor). Los postergados solo se
     informan: anular es decisión del admin. */
  refreshProdeMatchdayResults = async (matchdayId) => {
    await promoteExpiredMatchday(matchdayId);
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    if (matchday.phase !== "in_play") {
      throw new Error(
        "Los resultados se traen con la fecha en juego (post-deadline)",
      );
    }

    const pendingItems = matchday.items.filter(
      (item) =>
        item.kind === "match" &&
        item.source === "api" &&
        item.status === "scheduled" &&
        item.providerEventId,
    );
    if (pendingItems.length === 0) {
      throw new Error(
        "No hay partidos del catálogo pendientes de resultado en esta fecha",
      );
    }

    const summary = {
      updated: 0,
      updatedItemIds: [],
      stillPending: [],
      postponed: [],
      failed: [],
    };

    /* Secuencial a propósito: el adapter espacia los requests para el rate
       limit; una falla puntual no aborta el resto del lote */
    for (const item of pendingItems) {
      const label = `${item.homeName} vs ${item.awayName}`;

      let event;
      try {
        event = await getEventResult(item.providerEventId);
      } catch (error) {
        console.error(
          `Refresh de resultado falló para ${label}:`,
          error.message,
        );
        summary.failed.push(label);
        continue;
      }

      if (
        event.status === "finished" &&
        Number.isInteger(event.homeScore) &&
        Number.isInteger(event.awayScore)
      ) {
        item.scoreHome = event.homeScore;
        item.scoreAway = event.awayScore;
        item.status = "finished";
        summary.updated += 1;
        summary.updatedItemIds.push(String(item._id));
      } else if (event.status === "postponed") {
        summary.postponed.push(label);
      } else {
        summary.stillPending.push(label);
      }
    }

    if (summary.updated > 0) await matchday.save();
    return { matchday, summary };
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

  /* --------------- ADD MATCHDAY ITEMS FROM CATALOG --------------- */
  /* Alta masiva desde el catálogo de la API deportiva. El server recibe solo
     los IDs y rearma cada ítem con los datos oficiales del provider (nunca
     confía en equipos/horarios que vengan del navegador). Gracias al cache
     del adapter la re-consulta normalmente no cuesta requests extra. */
  addProdeMatchdayItemsFromCatalog = async (
    matchdayId,
    { challenge, leagueId, providerEventIds },
  ) => {
    const matchday = await ProdeMatchday.findById(matchdayId);
    if (!matchday) throw new Error("Fecha no encontrada");
    assertItemsEditable(matchday);

    if (!CART_CHALLENGES.includes(challenge)) {
      throw new Error(
        "El ítem debe pertenecer a Prode Argentina (ARG) o Prode Resto del Mundo (MISC)",
      );
    }

    const ids = [...new Set((providerEventIds ?? []).map(String))];
    if (ids.length === 0) {
      throw new Error("Elegí al menos un partido del catálogo");
    }

    const upcoming = await getUpcomingEventsByLeague(leagueId);
    const eventsById = new Map(
      upcoming.map((event) => [event.providerEventId, event]),
    );

    const missing = ids.filter((id) => !eventsById.has(id));
    if (missing.length > 0) {
      throw new Error(
        "Algunos partidos elegidos ya no están disponibles en el catálogo (pueden haber empezado): actualizá la lista",
      );
    }

    /* Sin duplicados en la fecha, aunque estén en el otro desafío */
    const alreadyAdded = new Set(
      matchday.items
        .filter((item) => item.providerEventId)
        .map((item) => String(item.providerEventId)),
    );
    const duplicated = ids.filter((id) => alreadyAdded.has(id));
    if (duplicated.length > 0) {
      const names = duplicated
        .map((id) => {
          const event = eventsById.get(id);
          return `${event.homeTeam} vs ${event.awayTeam}`;
        })
        .join(", ");
      throw new Error(`Estos partidos ya están en la fecha: ${names}`);
    }

    for (const id of ids) {
      const event = eventsById.get(id);
      matchday.items.push({
        challenge,
        kind: "match",
        source: "api",
        providerEventId: event.providerEventId,
        leagueName: event.leagueName ?? "",
        homeName: event.homeTeam,
        awayName: event.awayTeam,
        kickoffAt: new Date(event.kickoff),
        pointsHome: 5,
        pointsDraw: 5,
        pointsAway: 5,
      });
    }

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

    /* En ítems del catálogo (source "api") equipos/kickoff/liga son del
       proveedor: se preservan siempre, o el refresh de resultados por
       providerEventId quedaría vinculado a datos mentirosos. Solo los
       puntos (y el desafío) siguen siendo del admin. */
    const fromCatalog = item.source === "api";
    const merged =
      item.kind === "match"
        ? {
            challenge: itemData.challenge ?? item.challenge,
            kind: "match",
            leagueName: fromCatalog
              ? item.leagueName
              : (itemData.leagueName ?? item.leagueName),
            homeName: fromCatalog
              ? item.homeName
              : (itemData.homeName ?? item.homeName),
            awayName: fromCatalog
              ? item.awayName
              : (itemData.awayName ?? item.awayName),
            kickoffAt: fromCatalog
              ? item.kickoffAt
              : (itemData.kickoffAt ?? item.kickoffAt),
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
