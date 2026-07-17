import GdtUniverse from "../../dao/models/prode/GdtUniverseModel.js";
import GdtRealPlayer from "../../dao/models/prode/GdtRealPlayerModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import { getSupportedLeagues } from "../../integrations/sportsProvider/index.js";
import { emailTournamentParticipants } from "./prodeMatchdayRepository.js";
import {
  GDT_SLOT_LAYOUT,
  GDT_BURN_THRESHOLD,
} from "../../dao/models/prode/prodeConstants.js";
import {
  monthIndexOf,
  squadOwnerId,
  latestSquadsByPlayer,
} from "./gdtSquadVersioning.js";
import {
  buildProdeEmailHTML,
  formatDeadlineForEmail,
} from "../../helpers/prodeEmailTemplate.js";

/* Un plantel guardado puede volverse inconsistente si el admin corrige el
   pool (posición mal asignada, transferencia de club en el mercado de
   pases): acá se detecta para avisar sin esperar al guardado siguiente.
   La revelación (4.3b) exigirá cero inconsistencias. */
const squadNeedsFix = (squad) => {
  const clubsUsed = new Set();
  for (const slot of squad.slots ?? []) {
    const player = slot.realPlayer;
    if (!player || !player.position) return true;
    if (player.position !== GDT_SLOT_LAYOUT[slot.slotNumber - 1]) return true;
    const clubKey = (player.club ?? "").trim().toLowerCase();
    if (clubsUsed.has(clubKey)) return true;
    clubsUsed.add(clubKey);
  }
  return false;
};

const MAX_GDT_UNIVERSES = 3;

/* Universo + participantes (con nombre) del torneo al que pertenece */
const getUniverseWithParticipants = async (universeId) => {
  const universe = await GdtUniverse.findById(universeId);
  if (!universe) throw new Error("Universo GDT no encontrado");
  const tournament = await ProdeTournament.findById(universe.tournament, {
    name: 1,
    year: 1,
    months: 1,
    participants: 1,
  }).populate("participants", "name");
  if (!tournament) throw new Error("Torneo no encontrado");
  return { universe, tournament };
};

/* Ventana de cambios en curso (abierta o resolviendo quemas) */
const getActiveWindow = (universe) =>
  (universe.changeWindows ?? []).find((window) => window.status !== "final") ??
  null;

export default class GdtUniverseRepository {
  /* --------------- CREATE GDT TEAM --------------- */
  createGdtUniverse = async ({
    tournament: tournamentId,
    label,
    leagueProviderId,
    isPrimary,
  }) => {
    const tournament = await ProdeTournament.findById(tournamentId);
    if (!tournament) throw new Error("Torneo no encontrado");
    if (tournament.status === "finished") {
      throw new Error("El torneo ya está finalizado");
    }
    if (!label?.trim()) {
      throw new Error("El nombre del universo GDT es obligatorio");
    }

    const league = getSupportedLeagues().find(
      (item) => item.id === String(leagueProviderId),
    );
    if (!league) {
      throw new Error("La liga no está dentro del catálogo soportado");
    }

    const count = await GdtUniverse.countDocuments({ tournament: tournamentId });
    if (count >= MAX_GDT_UNIVERSES) {
      throw new Error(
        `El torneo ya tiene ${MAX_GDT_UNIVERSES} universos GDT (el máximo: principal + 2 suplentes)`,
      );
    }

    const wantsPrimary = Boolean(isPrimary);
    if (wantsPrimary) {
      const primaryExists = await GdtUniverse.exists({
        tournament: tournamentId,
        isPrimary: true,
      });
      if (primaryExists) {
        throw new Error("El torneo ya tiene un universo GDT principal");
      }
    }

    return GdtUniverse.create({
      tournament: tournamentId,
      label: label.trim(),
      league: league.name,
      leagueProviderId: league.id,
      isPrimary: wantsPrimary,
    });
  };

  /* --------------- GET GDT TEAMS BY TOURNAMENT --------------- */
  getGdtUniversesByTournament = async (tournamentId) => {
    const teams = await GdtUniverse.find({ tournament: tournamentId }).sort({
      isPrimary: -1,
      createdAt: 1,
    });

    const counts = await GdtRealPlayer.aggregate([
      { $match: { gdtUniverse: { $in: teams.map((team) => team._id) } } },
      { $group: { _id: "$gdtUniverse", count: { $sum: 1 } } },
    ]);
    const countById = Object.fromEntries(
      counts.map((item) => [String(item._id), item.count]),
    );

    return teams.map((team) => ({
      ...team.toObject(),
      poolCount: countById[String(team._id)] ?? 0,
    }));
  };

  /* --------------- GET GDT TEAM BY ID --------------- */
  getGdtUniverseById = async (universeId) => {
    const team = await GdtUniverse.findById(universeId).populate(
      "tournament",
      "name year status",
    );
    if (!team) throw new Error("Universo GDT no encontrado");
    return team;
  };

  /* --------------- UPDATE GDT TEAM --------------- */
  updateGdtUniverse = async (universeId, { label }) => {
    const team = await GdtUniverse.findById(universeId);
    if (!team) throw new Error("Universo GDT no encontrado");

    if (label !== undefined) {
      if (!label.trim()) {
        throw new Error("El nombre del universo GDT es obligatorio");
      }
      team.label = label.trim();
    }

    return team.save();
  };

  /* --------------- DELETE GDT TEAM --------------- */
  /* Borra el universo completo en cascada (pool + planteles parciales).
     Regla del dueño (2026-07-09): bloquea solo si algún participante ya
     tiene su plantel COMPLETO (11 slots) — planteles a medio armar no son
     historia que valga la pena proteger. */
  deleteGdtUniverse = async (universeId) => {
    const team = await GdtUniverse.findById(universeId);
    if (!team) throw new Error("Universo GDT no encontrado");

    /* slots.10 existe ⇔ el plantel tiene 11 slots (el schema no permite más) */
    const completeSquadExists = await GdtSquad.exists({
      gdtUniverse: universeId,
      "slots.10": { $exists: true },
    });
    if (completeSquadExists) {
      throw new Error(
        "No se puede eliminar: al menos un participante ya tiene su plantel completo en este universo",
      );
    }

    const usedInMatchday = await ProdeMatchday.exists({ gdtUniverse: universeId });
    if (usedInMatchday) {
      throw new Error(
        "No se puede eliminar: hay fechas del torneo jugándose con este universo GDT",
      );
    }

    await GdtSquad.deleteMany({ gdtUniverse: universeId });
    await GdtRealPlayer.deleteMany({ gdtUniverse: universeId });
    return GdtUniverse.findByIdAndDelete(universeId);
  };

  /* --------------- SUPER DELETE GDT UNIVERSE --------------- */
  /* SOLO super admin (middleware): borra el universo aunque tenga planteles
     completos o fechas jugándose con él. Las fechas que lo usaban quedan
     sin universo asignado y pierden sus puntajes GDT cargados (los scores
     ya consolidados en los duelos NO se tocan). */
  superDeleteGdtUniverse = async (universeId) => {
    const team = await GdtUniverse.findById(universeId);
    if (!team) throw new Error("Universo GDT no encontrado");

    await ProdeMatchday.updateMany(
      { gdtUniverse: universeId },
      { $set: { gdtUniverse: null, gdtScores: [] } },
    );
    await GdtSquad.deleteMany({ gdtUniverse: universeId });
    await GdtRealPlayer.deleteMany({ gdtUniverse: universeId });
    return GdtUniverse.findByIdAndDelete(universeId);
  };

  /* --------------- OPEN GDT DRAFT --------------- */
  /* El draft arranca cuando el admin lo abre explícitamente: fija el
     deadline y avisa por mail a los participantes. El armado es A CIEGAS:
     nadie ve nada de nadie hasta la revelación (manual, 4.3b). */
  openGdtDraft = async (universeId, draftDeadline) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (universe.draftStatus !== "setup") {
      throw new Error("El draft de este universo ya fue abierto");
    }

    const deadline = draftDeadline ? new Date(draftDeadline) : null;
    if (!deadline || Number.isNaN(deadline.getTime())) {
      throw new Error("El deadline del draft es obligatorio");
    }
    if (deadline <= new Date()) {
      throw new Error("El deadline del draft debe estar en el futuro");
    }

    const participants = tournament.participants ?? [];
    if (participants.length === 0) {
      throw new Error(
        "El torneo no tiene participantes cargados: agregalos antes de abrir el draft",
      );
    }

    const eligibleCount = await GdtRealPlayer.countDocuments({
      gdtUniverse: universeId,
      position: { $ne: null },
    });
    if (eligibleCount === 0) {
      throw new Error(
        "El pool del universo no tiene jugadores elegibles: importá los planteles antes de abrir el draft",
      );
    }

    universe.draftStatus = "open";
    universe.draftDeadline = deadline;
    await universe.save();

    const subject = `Draft del Gran DT abierto — ${universe.label}`;
    const deadlineText = formatDeadlineForEmail(deadline);
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#9917;",
        title: "Se abri&oacute; el draft del Gran DT",
        bodyHtml: `Hola ${user.first_name}, ya pod&eacute;s armar tu equipo de 11 para <strong style="color:#e8e8e8;">${universe.label}</strong> (${universe.league}) de ${tournament.name}. El armado es a ciegas: nadie ve tu plantel hasta la revelaci&oacute;n. Ten&eacute;s tiempo hasta el <strong style="color:#e8e8e8;">${deadlineText}</strong>.`,
        ctaLabel: "Armar mi equipo",
        ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
      });
    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants(participants, subject, generateHTML);

    return { universe, failedEmails, participantsWithoutUser };
  };

  /* --------------- UPDATE GDT DRAFT DEADLINE --------------- */
  /* El deadline es solo la fecha objetivo comunicada (no bloquea nada — el
     corte real es la revelación): editarlo es corregir esa referencia. */
  updateGdtDraftDeadline = async (universeId, draftDeadline) => {
    const universe = await GdtUniverse.findById(universeId);
    if (!universe) throw new Error("Universo GDT no encontrado");
    if (universe.draftStatus !== "open") {
      throw new Error(
        "El deadline solo puede modificarse con el draft abierto",
      );
    }

    const deadline = draftDeadline ? new Date(draftDeadline) : null;
    if (!deadline || Number.isNaN(deadline.getTime())) {
      throw new Error("El deadline del draft es obligatorio");
    }
    if (deadline <= new Date()) {
      throw new Error("El deadline del draft debe estar en el futuro");
    }

    universe.draftDeadline = deadline;
    return universe.save();
  };

  /* --------------- REVEAL GDT DRAFT --------------- */
  /* El momento central del draft: exige el 100% de los planteles completos
     y consistentes (el draft solo se aprueba con 0 conflictos — regla
     canónica), calcula las QUEMAS (jugador en 4+ planteles se quema para
     todo el torneo; en 2-3 se comparte) y desde acá todos ven todo. Sin
     quemas el draft pasa directo a final; con quemas queda "revealed" a la
     espera de las rondas de reemplazo. Mail SOLO a los afectados. */
  revealGdtDraft = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (universe.draftStatus !== "open") {
      throw new Error(
        universe.draftStatus === "setup"
          ? "El draft todavía no fue abierto"
          : "Los planteles de este universo ya fueron revelados",
      );
    }

    const participants = tournament.participants ?? [];
    if (participants.length === 0) {
      throw new Error("El torneo no tiene participantes cargados");
    }

    const squads = await GdtSquad.find({
      gdtUniverse: universeId,
      month: null,
    }).populate("slots.realPlayer", "name club position");
    const squadByPlayer = new Map(
      squads.map((squad) => [String(squad.player), squad]),
    );

    const missing = [];
    const inconsistent = [];
    for (const participant of participants) {
      const squad = squadByPlayer.get(String(participant._id));
      if (!squad || (squad.slots?.length ?? 0) !== 11) {
        missing.push(participant.name);
      } else if (squadNeedsFix(squad)) {
        inconsistent.push(participant.name);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `No se puede revelar: faltan planteles completos de ${missing.join(", ")}`,
      );
    }
    if (inconsistent.length > 0) {
      throw new Error(
        `No se puede revelar: hay planteles a corregir de ${inconsistent.join(", ")} (una corrección del pool los invalidó)`,
      );
    }

    /* Quemas: conteo de apariciones de cada jugador entre los planteles */
    const appearanceCount = new Map();
    for (const participant of participants) {
      const squad = squadByPlayer.get(String(participant._id));
      for (const slot of squad.slots) {
        const realPlayerId = String(slot.realPlayer._id);
        appearanceCount.set(
          realPlayerId,
          (appearanceCount.get(realPlayerId) ?? 0) + 1,
        );
      }
    }
    const burnedIds = [...appearanceCount]
      .filter(([, count]) => count >= GDT_BURN_THRESHOLD)
      .map(([realPlayerId]) => realPlayerId);
    const burnedSet = new Set(burnedIds);

    universe.burned = burnedIds;
    universe.draftStatus = burnedIds.length === 0 ? "final" : "revealed";
    await universe.save();

    /* Afectados: todo el que tenga al menos un quemado debe reemplazarlo */
    const affectedInfo = [];
    for (const participant of participants) {
      const squad = squadByPlayer.get(String(participant._id));
      const burnedNames = squad.slots
        .filter((slot) => burnedSet.has(String(slot.realPlayer._id)))
        .map((slot) => slot.realPlayer.name);
      if (burnedNames.length > 0) {
        affectedInfo.push({ participant, burnedNames });
      }
    }

    let failedEmails = [];
    let participantsWithoutUser = [];
    if (affectedInfo.length > 0) {
      const burnedNamesByPlayer = new Map(
        affectedInfo.map((info) => [
          String(info.participant._id),
          info.burnedNames,
        ]),
      );
      const subject = `Draft del Gran DT: tenés jugadores por reemplazar`;
      const generateHTML = (user) => {
        const names = burnedNamesByPlayer.get(String(user.prode_player)) ?? [];
        return buildProdeEmailHTML({
          iconHtml: "&#128293;",
          title: "Se revelaron los planteles: hay quemas",
          bodyHtml: `Hola ${user.first_name}, se revelaron los planteles de <strong style="color:#e8e8e8;">${universe.label}</strong> (${universe.league}) de ${tournament.name}. De tu equipo se ${names.length === 1 ? "quem&oacute;" : "quemaron"} <strong style="color:#e8e8e8;">${names.join(", ")}</strong> por estar en ${GDT_BURN_THRESHOLD} o m&aacute;s planteles. Cuando el admin abra la ronda de reemplazos vas a poder elegir ${names.length === 1 ? "su reemplazo" : "sus reemplazos"} viendo los planteles de todos.`,
          ctaLabel: "Ver los planteles",
          ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
        });
      };
      ({ failedEmails, participantsWithoutUser } =
        await emailTournamentParticipants(
          affectedInfo.map((info) => info.participant),
          subject,
          generateHTML,
        ));
    }

    return {
      universe,
      burnedCount: burnedIds.length,
      affected: affectedInfo.map((info) => ({
        name: info.participant.name,
        burnedCount: info.burnedNames.length,
      })),
      failedEmails,
      participantsWithoutUser,
    };
  };

  /* --------------- OPEN GDT REPLACEMENT ROUND --------------- */
  /* Habilita a los afectados (slots con jugador quemado) a elegir sus
     reemplazos. La elección es SIMULTÁNEA Y A CIEGAS: se guarda en
     pendingReplacements y recién se aplica al cerrar la ronda. */
  openGdtReplacementRound = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (universe.draftStatus !== "revealed") {
      throw new Error(
        universe.draftStatus === "resolving"
          ? "Ya hay una ronda de reemplazos abierta"
          : "La ronda de reemplazos requiere planteles revelados con quemas pendientes",
      );
    }

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const squads = await GdtSquad.find({
      gdtUniverse: universeId,
      month: null,
    });
    const pendingBySquad = new Map();
    for (const squad of squads) {
      const pending = (squad.slots ?? []).filter((slot) =>
        burnedSet.has(String(slot.realPlayer)),
      ).length;
      if (pending > 0) pendingBySquad.set(String(squad.player), pending);
    }
    if (pendingBySquad.size === 0) {
      throw new Error(
        "No hay reemplazos pendientes: podés cerrar el draft directamente",
      );
    }

    universe.draftStatus = "resolving";
    await universe.save();

    const affected = (tournament.participants ?? []).filter((participant) =>
      pendingBySquad.has(String(participant._id)),
    );
    const subject = "Ronda de reemplazos abierta — Gran DT";
    const generateHTML = (user) => {
      const count = pendingBySquad.get(String(user.prode_player)) ?? 0;
      return buildProdeEmailHTML({
        iconHtml: "&#8634;",
        title: "Se abri&oacute; la ronda de reemplazos",
        bodyHtml: `Hola ${user.first_name}, ya pod&eacute;s elegir ${count === 1 ? "el reemplazo de tu jugador quemado" : `los reemplazos de tus ${count} jugadores quemados`} en <strong style="color:#e8e8e8;">${universe.label}</strong>. Eleg&iacute;s viendo los planteles de todos, pero tu elecci&oacute;n es a ciegas: nadie la ve hasta que el admin cierre la ronda. Si varios eligen al mismo jugador, puede haber quemas nuevas.`,
        ctaLabel: "Elegir reemplazos",
        ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
      });
    };
    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants(affected, subject, generateHTML);

    return {
      universe,
      affectedCount: affected.length,
      failedEmails,
      participantsWithoutUser,
    };
  };

  /* --------------- CLOSE GDT REPLACEMENT ROUND --------------- */
  /* El momento de la verdad de la ronda: se revelan las elecciones. Un
     entrante elegido por 4+ se QUEMA (nueva) y esas elecciones se
     descartan (el slot sigue pendiente para la próxima ronda); elegido por
     2-3 se comparte; el resto se aplica al slot. Guarda extra: si al
     aplicar quedara un conflicto de club (borde: otro reemplazo del mismo
     plantel se descartó por quema nueva), ese reemplazo también se
     descarta y se informa. */
  closeGdtReplacementRound = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (universe.draftStatus !== "resolving") {
      throw new Error("No hay una ronda de reemplazos abierta");
    }

    const squads = await GdtSquad.find({
      gdtUniverse: universeId,
      month: null,
    })
      .populate("slots.realPlayer", "name club")
      .populate("pendingReplacements.realPlayer", "name club");

    /* Quemas nuevas: conteo de entrantes elegidos en esta ronda */
    const entrantCount = new Map();
    for (const squad of squads) {
      for (const staged of squad.pendingReplacements ?? []) {
        if (!staged.realPlayer) continue;
        const entrantId = String(staged.realPlayer._id);
        entrantCount.set(entrantId, (entrantCount.get(entrantId) ?? 0) + 1);
      }
    }
    const newBurnedIds = [...entrantCount]
      .filter(([, count]) => count >= GDT_BURN_THRESHOLD)
      .map(([entrantId]) => entrantId);
    const newBurnedSet = new Set(newBurnedIds);

    const burnedSet = new Set([
      ...(universe.burned ?? []).map(String),
      ...newBurnedIds,
    ]);

    const normClub = (club) => (club ?? "").trim().toLowerCase();
    const participantById = new Map(
      (tournament.participants ?? []).map((p) => [String(p._id), p]),
    );

    let applied = 0;
    let stillPendingTotal = 0;
    const reBurnedByPlayer = new Map(); // playerId -> nombres de entrantes re-quemados
    const discardedByClub = [];

    for (const squad of squads) {
      const clubBySlot = new Map(
        (squad.slots ?? []).map((slot) => [
          slot.slotNumber,
          normClub(slot.realPlayer?.club),
        ]),
      );
      const finalPlayerBySlot = new Map(
        (squad.slots ?? []).map((slot) => [
          slot.slotNumber,
          String(slot.realPlayer?._id ?? slot.realPlayer),
        ]),
      );

      /* ① Los quemados de este cierre se descartan (el slot sigue pendiente) */
      let applicable = [];
      for (const staged of squad.pendingReplacements ?? []) {
        const slot = (squad.slots ?? []).find(
          (item) => item.slotNumber === staged.slotNumber,
        );
        const entrant = staged.realPlayer;
        if (!slot || !entrant) continue;

        if (newBurnedSet.has(String(entrant._id))) {
          const key = String(squad.player);
          const names = reBurnedByPlayer.get(key) ?? [];
          names.push(entrant.name);
          reBurnedByPlayer.set(key, names);
          continue;
        }
        applicable.push(staged);
      }

      /* ② Cadenas rotas por descartes: punto fijo independiente del orden
         de los slots (un reemplazo que contaba con que otro liberaba un
         club cae junto con él) */
      let stable = false;
      while (!stable) {
        stable = true;
        const tentativeClubs = new Map(clubBySlot);
        for (const staged of applicable) {
          tentativeClubs.set(
            staged.slotNumber,
            normClub(staged.realPlayer.club),
          );
        }
        for (const staged of applicable) {
          const entrantClub = normClub(staged.realPlayer.club);
          const clash = [...tentativeClubs].some(
            ([slotNumber, club]) =>
              slotNumber !== staged.slotNumber &&
              club &&
              club === entrantClub,
          );
          if (clash) {
            const owner = participantById.get(String(squad.player));
            discardedByClub.push(
              `${staged.realPlayer.name} (${owner?.name ?? "?"}): conflicto de club`,
            );
            applicable = applicable.filter((other) => other !== staged);
            stable = false;
            break;
          }
        }
      }

      /* ③ Aplicar los reemplazos que sobrevivieron */
      for (const staged of applicable) {
        const slot = (squad.slots ?? []).find(
          (item) => item.slotNumber === staged.slotNumber,
        );
        slot.realPlayer = staged.realPlayer._id;
        finalPlayerBySlot.set(
          staged.slotNumber,
          String(staged.realPlayer._id),
        );
        applied += 1;
      }

      squad.pendingReplacements = [];
      await squad.save();

      for (const finalPlayerId of finalPlayerBySlot.values()) {
        if (burnedSet.has(finalPlayerId)) stillPendingTotal += 1;
      }
    }

    universe.burned = [...burnedSet];
    universe.draftStatus = "revealed";
    await universe.save();

    /* Mail a quienes su reemplazo TAMBIÉN se quemó: van a otra ronda */
    let failedEmails = [];
    let participantsWithoutUser = [];
    if (reBurnedByPlayer.size > 0) {
      const affected = (tournament.participants ?? []).filter((participant) =>
        reBurnedByPlayer.has(String(participant._id)),
      );
      const subject = "Tu reemplazo también se quemó — Gran DT";
      const generateHTML = (user) => {
        const names = reBurnedByPlayer.get(String(user.prode_player)) ?? [];
        return buildProdeEmailHTML({
          iconHtml: "&#128293;",
          title: "Quema nueva en la ronda de reemplazos",
          bodyHtml: `Hola ${user.first_name}, en <strong style="color:#e8e8e8;">${universe.label}</strong> ${names.length === 1 ? "tu reemplazo" : "tus reemplazos"} <strong style="color:#e8e8e8;">${names.join(", ")}</strong> ${names.length === 1 ? "fue elegido" : "fueron elegidos"} por ${GDT_BURN_THRESHOLD} o m&aacute;s y se ${names.length === 1 ? "quem&oacute;" : "quemaron"} tambi&eacute;n. Vas a poder elegir de nuevo cuando el admin abra la pr&oacute;xima ronda.`,
          ctaLabel: "Ver los planteles",
          ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
        });
      };
      ({ failedEmails, participantsWithoutUser } =
        await emailTournamentParticipants(affected, subject, generateHTML));
    }

    const newBurnedPlayers =
      newBurnedIds.length > 0
        ? await GdtRealPlayer.find(
            { _id: { $in: newBurnedIds } },
            { name: 1, club: 1 },
          )
        : [];

    return {
      universe,
      applied,
      newBurnedPlayers,
      stillPendingTotal,
      discardedByClub,
      failedEmails,
      participantsWithoutUser,
    };
  };

  /* --------------- FINALIZE GDT DRAFT --------------- */
  /* Con cero reemplazos pendientes, el draft queda FINAL: los planteles
     son definitivos y el universo pasa a ser asignable a fechas. */
  finalizeGdtDraft = async (universeId) => {
    const universe = await GdtUniverse.findById(universeId);
    if (!universe) throw new Error("Universo GDT no encontrado");
    if (universe.draftStatus !== "revealed") {
      throw new Error(
        universe.draftStatus === "resolving"
          ? "Cerrá la ronda de reemplazos antes de cerrar el draft"
          : "El draft no está en condiciones de cerrarse",
      );
    }

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const squads = await GdtSquad.find({
      gdtUniverse: universeId,
      month: null,
    });
    const pendingTotal = squads.reduce(
      (sum, squad) =>
        sum +
        (squad.slots ?? []).filter((slot) =>
          burnedSet.has(String(slot.realPlayer)),
        ).length,
      0,
    );
    if (pendingTotal > 0) {
      throw new Error(
        `Quedan ${pendingTotal} reemplazos pendientes: abrí otra ronda antes de cerrar el draft`,
      );
    }

    universe.draftStatus = "final";
    return universe.save();
  };

  /* --------------- OPEN GDT CHANGE WINDOW --------------- */
  /* Ventana mensual de cambios (SOLO universo principal con draft final):
     hasta 2 cambios por participante, a ciegas, o "confirmar sin cambios".
     El mes elegido acá es el de la versión que nacerá al cierre. */
  openGdtChangeWindow = async (universeId, { month, deadline }) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (!universe.isPrimary) {
      throw new Error(
        "Solo el universo principal tiene ventanas de cambios (los suplentes quedan fijos tras su draft)",
      );
    }
    if (universe.draftStatus !== "final") {
      throw new Error(
        "La ventana de cambios requiere el draft cerrado (planteles definitivos)",
      );
    }
    if (getActiveWindow(universe)) {
      throw new Error("Ya hay una ventana de cambios en curso");
    }

    const months = tournament.months ?? [];
    if (!months.includes(month)) {
      throw new Error(`El mes "${month}" no forma parte del torneo`);
    }
    const monthIndex = monthIndexOf(months, month);
    /* El primer mes del torneo se juega con el plantel del draft: la
       primera ventana posible es la del segundo mes */
    if (monthIndex === 0) {
      throw new Error(
        `${month} es el mes del draft: los planteles de ese mes son los del armado inicial`,
      );
    }
    for (const previous of universe.changeWindows ?? []) {
      if (monthIndexOf(months, previous.month) >= monthIndex) {
        throw new Error(
          `Ya existe una ventana para "${previous.month}": los meses de las ventanas deben avanzar en orden`,
        );
      }
    }

    const deadlineDate = deadline ? new Date(deadline) : null;
    if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) {
      throw new Error("La fecha objetivo de la ventana es obligatoria");
    }
    if (deadlineDate <= new Date()) {
      throw new Error("La fecha objetivo debe estar en el futuro");
    }

    universe.changeWindows.push({
      month,
      deadline: deadlineDate,
      status: "open",
    });
    await universe.save();

    const participants = tournament.participants ?? [];
    const subject = `Ventana de cambios de ${month} abierta — Gran DT`;
    const deadlineText = formatDeadlineForEmail(deadlineDate);
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#8644;",
        title: `Ventana de cambios de ${month}`,
        bodyHtml: `Hola ${user.first_name}, se abri&oacute; la ventana de cambios de <strong style="color:#e8e8e8;">${universe.label}</strong>: pod&eacute;s hacer hasta 2 cambios en tu equipo, a ciegas, hasta el <strong style="color:#e8e8e8;">${deadlineText}</strong> (fecha objetivo). Si no vas a cambiar nada, confirmalo en la pantalla as&iacute; el admin puede cerrar antes.`,
        ctaLabel: "Hacer mis cambios",
        ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
      });
    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants(participants, subject, generateHTML);

    return { universe, failedEmails, participantsWithoutUser };
  };

  /* --------------- CLOSE GDT CHANGE WINDOW --------------- */
  /* Cierre unificado: el PRIMER cierre revela los cambios de todos, quema
     entrantes elegidos por 4+ (para TODO el torneo), aplica el resto y crea
     la VERSIÓN DEL MES para todos (cambios aplicados o copia idéntica —
     versionado denso). Si hubo quemas, la ventana queda "resolving" y los
     afectados re-eligen a ciegas (ronda de la ventana); cada cierre
     posterior repite el proceso sobre sus re-elecciones. CONVERGE cuando un
     cierre no genera quemas nuevas: retries sin elegir caducan (conservan
     su jugador anterior — plantel válido igual). */
  closeGdtChangeWindow = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );
    const window = getActiveWindow(universe);
    if (!window) throw new Error("No hay una ventana de cambios en curso");

    const participants = tournament.participants ?? [];
    const months = tournament.months ?? [];
    const isFirstClose = window.status === "open";

    const allSquads = await GdtSquad.find({ gdtUniverse: universeId })
      .populate("slots.realPlayer", "name club")
      .populate("pendingReplacements.realPlayer", "name club");

    /* Documentos fuente de este cierre: pre-ventana en el primer cierre,
       la versión del mes en los cierres de ronda */
    const sourceByPlayer = isFirstClose
      ? latestSquadsByPlayer(allSquads, months, { beforeMonth: window.month })
      : new Map(
          allSquads
            .filter((squad) => squad.month === window.month)
            .map((squad) => [squadOwnerId(squad), squad]),
        );

    /* Elecciones que juegan en este cierre */
    const stagedByPlayer = new Map();
    for (const participant of participants) {
      const source = sourceByPlayer.get(String(participant._id));
      if (!source) continue;
      let staged = (source.pendingReplacements ?? []).filter(
        (item) => item.realPlayer,
      );
      if (!isFirstClose) {
        const retrySet = new Set(source.windowRetrySlots ?? []);
        staged = staged.filter((item) => retrySet.has(item.slotNumber));
      }
      if (staged.length > 0) stagedByPlayer.set(String(participant._id), staged);
    }

    /* Quemas nuevas (4+ el mismo entrante) — quemado para TODO el torneo */
    const entrantCount = new Map();
    for (const staged of stagedByPlayer.values()) {
      for (const item of staged) {
        const entrantId = String(item.realPlayer._id);
        entrantCount.set(entrantId, (entrantCount.get(entrantId) ?? 0) + 1);
      }
    }
    const newBurnedIds = [...entrantCount]
      .filter(([, count]) => count >= GDT_BURN_THRESHOLD)
      .map(([entrantId]) => entrantId);
    const newBurnedSet = new Set(newBurnedIds);
    const converged = newBurnedIds.length === 0;

    const burnedSet = new Set([
      ...(universe.burned ?? []).map(String),
      ...newBurnedIds,
    ]);

    const normClub = (club) => (club ?? "").trim().toLowerCase();
    let applied = 0;
    let retryTotal = 0;
    const discardedByClub = [];
    const reBurnedByPlayer = new Map();

    for (const participant of participants) {
      const playerKey = String(participant._id);
      const source = sourceByPlayer.get(playerKey);
      if (!source) continue;

      const staged = stagedByPlayer.get(playerKey) ?? [];
      const clubBySlot = new Map(
        (source.slots ?? []).map((slot) => [
          slot.slotNumber,
          normClub(slot.realPlayer?.club),
        ]),
      );
      /* El bloqueo del admin se hereda al mes nuevo mientras el jugador
         siga; un slot cuyo jugador cambia entra limpio */
      const newSlots = (source.slots ?? []).map((slot) => ({
        slotNumber: slot.slotNumber,
        position: slot.position,
        realPlayer: slot.realPlayer?._id ?? slot.realPlayer,
        blocked: Boolean(slot.blocked),
      }));
      const slotByNumber = new Map(
        newSlots.map((slot) => [slot.slotNumber, slot]),
      );
      let retrySlots = isFirstClose ? [] : [...(source.windowRetrySlots ?? [])];

      /* ① Los quemados de este cierre se descartan y van a re-elección */
      let applicable = [];
      for (const item of staged) {
        const entrant = item.realPlayer;
        if (!slotByNumber.get(item.slotNumber)) continue;

        if (newBurnedSet.has(String(entrant._id))) {
          const names = reBurnedByPlayer.get(playerKey) ?? [];
          names.push(entrant.name);
          reBurnedByPlayer.set(playerKey, names);
          if (!retrySlots.includes(item.slotNumber)) {
            retrySlots.push(item.slotNumber);
          }
          continue;
        }
        applicable.push(item);
      }

      /* ② Cadenas rotas: un cambio validado contando con que OTRO cambio
         liberaba un club cae junto con él si ese otro se descartó (el slot
         descartado revierte a su jugador anterior y el club vuelve a estar
         ocupado). Punto fijo, independiente del orden de los slots; los
         conflictos preexistentes entre slots NO cambiados se toleran. */
      let stable = false;
      while (!stable) {
        stable = true;
        const tentativeClubs = new Map(clubBySlot);
        for (const item of applicable) {
          tentativeClubs.set(item.slotNumber, normClub(item.realPlayer.club));
        }
        for (const item of applicable) {
          const entrantClub = normClub(item.realPlayer.club);
          const clash = [...tentativeClubs].some(
            ([slotNumber, club]) =>
              slotNumber !== item.slotNumber &&
              club &&
              club === entrantClub,
          );
          if (clash) {
            discardedByClub.push(
              `${item.realPlayer.name} (${participant.name}): dependía de un cambio descartado`,
            );
            if (!retrySlots.includes(item.slotNumber)) {
              retrySlots.push(item.slotNumber);
            }
            applicable = applicable.filter((other) => other !== item);
            stable = false;
            break;
          }
        }
      }

      /* ③ Aplicar los cambios que sobrevivieron (el entrante llega limpio,
         sin heredar un bloqueo del saliente) */
      for (const item of applicable) {
        const target = slotByNumber.get(item.slotNumber);
        target.realPlayer = item.realPlayer._id;
        target.blocked = false;
        retrySlots = retrySlots.filter(
          (slotNumber) => slotNumber !== item.slotNumber,
        );
        applied += 1;
      }

      /* Al converger, los retries sin re-elegir caducan: conservan su
         jugador anterior, que es un plantel válido */
      if (converged) retrySlots = [];
      retryTotal += retrySlots.length;

      if (isFirstClose) {
        await GdtSquad.create({
          gdtUniverse: universeId,
          player: participant._id,
          month: window.month,
          slots: newSlots,
          windowRetrySlots: retrySlots,
          submittedAt: new Date(),
        });
        source.pendingReplacements = [];
        source.windowNoChanges = false;
        await source.save();
      } else {
        source.slots = newSlots;
        source.pendingReplacements = [];
        source.windowRetrySlots = retrySlots;
        await source.save();
      }
    }

    universe.burned = [...burnedSet];
    window.status = converged ? "final" : "resolving";
    await universe.save();

    /* Mails: quemados de este cierre re-eligen; al converger, aviso a todos */
    let failedEmails = [];
    let participantsWithoutUser = [];
    if (reBurnedByPlayer.size > 0) {
      const affected = participants.filter((participant) =>
        reBurnedByPlayer.has(String(participant._id)),
      );
      const subject = "Tu cambio se quemó — ventana de cambios del Gran DT";
      const generateHTML = (user) => {
        const names = reBurnedByPlayer.get(String(user.prode_player)) ?? [];
        return buildProdeEmailHTML({
          iconHtml: "&#128293;",
          title: "Quema en la ventana de cambios",
          bodyHtml: `Hola ${user.first_name}, en la ventana de ${window.month} de <strong style="color:#e8e8e8;">${universe.label}</strong> ${names.length === 1 ? "tu entrante" : "tus entrantes"} <strong style="color:#e8e8e8;">${names.join(", ")}</strong> ${names.length === 1 ? "fue elegido" : "fueron elegidos"} por ${GDT_BURN_THRESHOLD} o m&aacute;s y se ${names.length === 1 ? "quem&oacute;" : "quemaron"} para todo el torneo. Ya pod&eacute;s re-elegir en la ronda de la ventana (o no hacer nada y conservar tu jugador anterior).`,
          ctaLabel: "Re-elegir",
          ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
        });
      };
      ({ failedEmails, participantsWithoutUser } =
        await emailTournamentParticipants(affected, subject, generateHTML));
    } else if (converged) {
      const subject = `Ventana de ${window.month} cerrada — Gran DT`;
      const generateHTML = (user) =>
        buildProdeEmailHTML({
          iconHtml: "&#10003;",
          title: `Ventana de ${window.month} cerrada`,
          bodyHtml: `Hola ${user.first_name}, se cerr&oacute; la ventana de cambios de ${window.month} en <strong style="color:#e8e8e8;">${universe.label}</strong>: los planteles del mes ya son definitivos. Entr&aacute; a ver c&oacute;mo quedaron todos los equipos.`,
          ctaLabel: "Ver los planteles",
          ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
        });
      ({ failedEmails, participantsWithoutUser } =
        await emailTournamentParticipants(participants, subject, generateHTML));
    }

    const newBurnedPlayers =
      newBurnedIds.length > 0
        ? await GdtRealPlayer.find(
            { _id: { $in: newBurnedIds } },
            { name: 1, club: 1 },
          )
        : [];

    return {
      window: {
        month: window.month,
        status: window.status,
      },
      applied,
      newBurnedPlayers,
      retryTotal,
      discardedByClub,
      failedEmails,
      participantsWithoutUser,
    };
  };

  /* --------------- REOPEN GDT WINDOW FOR (admin) --------------- */
  /* Excepción discrecional: reabrir la ÚLTIMA ventana cerrada para UN
     participante. No es ventaja sino castigo suave: elige viendo todo pero
     con menos opciones (entrantes ajenos tomados + salientes vedados) y
     dentro del tope de 2 cambios totales del mes. One-shot: su guardado
     consume la reapertura. */
  reopenGdtWindowFor = async (universeId, playerId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (getActiveWindow(universe)) {
      throw new Error(
        "Hay una ventana en curso: la reapertura es para ventanas ya cerradas",
      );
    }

    const months = tournament.months ?? [];
    const closed = (universe.changeWindows ?? []).filter(
      (item) => item.status === "final",
    );
    if (closed.length === 0) {
      throw new Error("No hay ventanas cerradas para reabrir");
    }
    const lastWindow = closed.reduce((max, item) =>
      monthIndexOf(months, item.month) > monthIndexOf(months, max.month)
        ? item
        : max,
    );

    const participant = (tournament.participants ?? []).find(
      (item) => String(item._id) === String(playerId),
    );
    if (!participant) {
      throw new Error("El jugador no es participante del torneo");
    }
    if ((lastWindow.reopenedFor ?? []).map(String).includes(String(playerId))) {
      throw new Error("Ese participante ya tiene la reapertura habilitada");
    }

    lastWindow.reopenedFor.push(playerId);
    await universe.save();

    const subject = `Te reabrieron los cambios de ${lastWindow.month} — Gran DT`;
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#8634;",
        title: `Cambios de ${lastWindow.month} reabiertos`,
        bodyHtml: `Hola ${user.first_name}, el admin te reabri&oacute; los cambios de ${lastWindow.month} en <strong style="color:#e8e8e8;">${universe.label}</strong>. Eleg&iacute;s viendo los planteles de todos, dentro del tope de 2 cambios del mes. OJO: al guardar, la reapertura se consume.`,
        ctaLabel: "Hacer mis cambios",
        ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
      });
    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants([participant], subject, generateHTML);

    return {
      universe,
      month: lastWindow.month,
      failedEmails,
      participantsWithoutUser,
    };
  };

  /* --------------- GRANT GDT CORRECTION (admin) --------------- */
  /* Corrección one-shot por ERROR DE DATOS del pool (la API trajo mal una
     posición o un club y el plantel quedó inconsistente sin culpa del
     dueño): el afectado repone SOLO sus slots inconsistentes, sin gastar
     cambios mensuales. Para transferencias REALES la herramienta es el
     bloqueo; para cambios estratégicos, la reapertura de ventana. */
  grantGdtCorrection = async (universeId, playerId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    if (universe.draftStatus !== "final") {
      throw new Error(
        "La corrección aplica sobre planteles definitivos (draft cerrado)",
      );
    }
    if (getActiveWindow(universe)) {
      throw new Error(
        "Hay una ventana de cambios en curso: el afectado puede corregir ahí (o cerrala primero)",
      );
    }

    const participant = (tournament.participants ?? []).find(
      (item) => String(item._id) === String(playerId),
    );
    if (!participant) {
      throw new Error("El jugador no es participante del torneo");
    }
    if (
      (universe.correctionsFor ?? []).map(String).includes(String(playerId))
    ) {
      throw new Error("Ese participante ya tiene una corrección habilitada");
    }

    universe.correctionsFor.push(playerId);
    await universe.save();

    const subject = "Corrección habilitada — Gran DT";
    const generateHTML = (user) =>
      buildProdeEmailHTML({
        iconHtml: "&#9998;",
        title: "Ten&eacute;s una correcci&oacute;n habilitada",
        bodyHtml: `Hola ${user.first_name}, se corrigi&oacute; un error de datos del pool en <strong style="color:#e8e8e8;">${universe.label}</strong> y tu plantel qued&oacute; con una inconsistencia que no es tu culpa. El admin te habilit&oacute; una correcci&oacute;n: pod&eacute;s reponer SOLO los slots marcados, sin gastar cambios mensuales. OJO: al guardar, la correcci&oacute;n se consume.`,
        ctaLabel: "Corregir mi plantel",
        ctaUrl: `https://elrincondechacho.com/prode/gdt/${universe._id}`,
      });
    const { failedEmails, participantsWithoutUser } =
      await emailTournamentParticipants([participant], subject, generateHTML);

    return { universe, failedEmails, participantsWithoutUser };
  };

  /* --------------- GET GDT WINDOW OVERVIEW (admin) --------------- */
  /* Tablero de la ventana: quién ya respondió (cambios listos / confirmó
     sin cambios / sin respuesta) — SIN contenido, la elección es a ciegas
     también para esta vista. En ronda: re-elecciones pendientes. */
  getGdtWindowOverview = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );
    const participants = tournament.participants ?? [];
    const months = tournament.months ?? [];
    const window = getActiveWindow(universe);

    const allSquads = await GdtSquad.find(
      { gdtUniverse: universeId },
      {
        player: 1,
        month: 1,
        slots: 1,
        pendingReplacements: 1,
        windowNoChanges: 1,
        windowRetrySlots: 1,
      },
    ).populate("slots.realPlayer", "name club");

    let participantRows = [];
    if (window) {
      const sourceByPlayer =
        window.status === "open"
          ? latestSquadsByPlayer(allSquads, months, {
              beforeMonth: window.month,
            })
          : new Map(
              allSquads
                .filter((squad) => squad.month === window.month)
                .map((squad) => [squadOwnerId(squad), squad]),
            );

      participantRows = participants.map((participant) => {
        const source = sourceByPlayer.get(String(participant._id));
        const retrySlots = source?.windowRetrySlots ?? [];
        const staged =
          window.status === "open"
            ? (source?.pendingReplacements ?? [])
            : (source?.pendingReplacements ?? []).filter((item) =>
                retrySlots.includes(item.slotNumber),
              );
        return {
          playerId: participant._id,
          name: participant.name,
          stagedCount: staged.length,
          noChanges: Boolean(source?.windowNoChanges),
          retryCount: retrySlots.length,
        };
      });
    }

    /* Meses del torneo con su elegibilidad para una ventana NUEVA:
       el primero está vedado (mes del draft) y solo se puede avanzar
       hacia adelante respecto de la última ventana (los meses con equipo
       cerrado no se pisan) */
    const maxWindowIndex = (universe.changeWindows ?? []).reduce(
      (max, item) => Math.max(max, monthIndexOf(months, item.month)),
      -1,
    );
    const monthOptions = months.map((item, index) => ({
      month: item,
      available: index > 0 && index > maxWindowIndex,
      reason:
        index === 0
          ? "mes del draft"
          : index <= maxWindowIndex
            ? "equipos del mes ya definidos"
            : null,
    }));

    /* Historial: cuántos cambios hizo cada uno en cada ventana cerrada.
       Con el versionado denso es un diff directo entre la versión del mes
       y la vigente anterior (slots cuyo jugador difiere). */
    const squadPlayersMap = (squad) =>
      new Map(
        (squad?.slots ?? []).map((slot) => [
          slot.slotNumber,
          {
            id: String(slot.realPlayer?._id ?? slot.realPlayer),
            name: slot.realPlayer?.name ?? "?",
            club: slot.realPlayer?.club ?? "?",
          },
        ]),
      );
    const pastWindows = (universe.changeWindows ?? [])
      .filter((item) => item.status === "final")
      .map((item) => {
        const monthVersions = new Map(
          allSquads
            .filter((squad) => squad.month === item.month)
            .map((squad) => [squadOwnerId(squad), squad]),
        );
        const previousVersions = latestSquadsByPlayer(allSquads, months, {
          beforeMonth: item.month,
        });
        const changes = participants.map((participant) => {
          const current = squadPlayersMap(
            monthVersions.get(String(participant._id)),
          );
          const previous = squadPlayersMap(
            previousVersions.get(String(participant._id)),
          );
          const moves = [];
          for (const [slotNumber, info] of current) {
            const before = previous.get(slotNumber);
            if (before && before.id !== info.id) {
              moves.push({
                out: before.name,
                outClub: before.club,
                in: info.name,
                inClub: info.club,
              });
            }
          }
          return {
            name: participant.name,
            changesCount: moves.length,
            moves,
          };
        });
        return { month: item.month, deadline: item.deadline, changes };
      });

    /* Reapertura: última ventana cerrada (si no hay una en curso) con sus
       reabiertos actuales, para el selector del admin */
    let reopenInfo = null;
    if (!window) {
      const closed = (universe.changeWindows ?? []).filter(
        (item) => item.status === "final",
      );
      if (closed.length > 0) {
        const lastWindow = closed.reduce((max, item) =>
          monthIndexOf(months, item.month) > monthIndexOf(months, max.month)
            ? item
            : max,
        );
        const reopenedSet = new Set(
          (lastWindow.reopenedFor ?? []).map(String),
        );
        reopenInfo = {
          month: lastWindow.month,
          reopenedNames: participants
            .filter((item) => reopenedSet.has(String(item._id)))
            .map((item) => item.name),
        };
      }
    }

    return {
      window: window
        ? {
            month: window.month,
            deadline: window.deadline,
            status: window.status,
          }
        : null,
      participants: participantRows,
      allParticipants: participants.map((item) => ({
        playerId: item._id,
        name: item.name,
      })),
      reopen: reopenInfo,
      pastWindows,
      monthOptions,
      availableMonths: monthOptions
        .filter((item) => item.available)
        .map((item) => item.month),
      isPrimary: universe.isPrimary,
      draftStatus: universe.draftStatus,
    };
  };

  /* --------------- GET GDT DRAFT OVERVIEW (admin) --------------- */
  /* Quién entregó plantel completo y quién no — SIN contenido: el armado
     es a ciegas también para esta vista. La revelación exige el 100% de
     los planteles completos (regla del dueño, sin hardcodear cantidad). */
  getGdtDraftOverview = async (universeId) => {
    const { universe, tournament } = await getUniverseWithParticipants(
      universeId,
    );

    const squads = await GdtSquad.find(
      { gdtUniverse: universeId, month: null },
      { player: 1, slots: 1, submittedAt: 1, pendingReplacements: 1 },
    ).populate("slots.realPlayer", "position club");
    const squadByPlayer = new Map(
      squads.map((squad) => [String(squad.player), squad]),
    );

    const burnedSet = new Set((universe.burned ?? []).map(String));

    const participants = (tournament.participants ?? []).map((participant) => {
      const squad = squadByPlayer.get(String(participant._id));
      const slotsCount = squad?.slots?.length ?? 0;
      /* Una corrección del pool puede invalidar un plantel ya guardado:
         deja de contar como completo hasta que su dueño lo corrija */
      const needsFix = squad ? squadNeedsFix(squad) : false;
      /* Post-revelación: slots ocupados por quemados, a reemplazar */
      const pendingSlots = (squad?.slots ?? []).filter((slot) =>
        burnedSet.has(String(slot.realPlayer?._id ?? slot.realPlayer)),
      ).length;
      return {
        playerId: participant._id,
        name: participant.name,
        slotsCount,
        needsFix,
        pendingSlots,
        /* En ronda abierta: cuántos reemplazos ya eligió (sin contenido —
           la elección es a ciegas también para esta vista) */
        stagedSlots: squad?.pendingReplacements?.length ?? 0,
        complete: slotsCount === 11 && !needsFix,
        submittedAt: squad?.submittedAt ?? null,
      };
    });

    const completeCount = participants.filter((p) => p.complete).length;

    const burnedPlayers =
      burnedSet.size > 0
        ? await GdtRealPlayer.find(
            { _id: { $in: [...burnedSet] } },
            { name: 1, club: 1 },
          ).sort({ name: 1 })
        : [];

    return {
      draftStatus: universe.draftStatus,
      draftDeadline: universe.draftDeadline,
      participants,
      completeCount,
      totalCount: participants.length,
      allComplete:
        participants.length > 0 && completeCount === participants.length,
      burnedPlayers,
      pendingTotal: participants.reduce((sum, p) => sum + p.pendingSlots, 0),
    };
  };
}
