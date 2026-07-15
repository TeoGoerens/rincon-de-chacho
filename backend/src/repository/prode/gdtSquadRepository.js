import GdtUniverse from "../../dao/models/prode/GdtUniverseModel.js";
import GdtRealPlayer from "../../dao/models/prode/GdtRealPlayerModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import { GDT_SLOT_LAYOUT } from "../../dao/models/prode/prodeConstants.js";
import {
  monthIndexOf,
  squadOwnerId,
  latestSquadsByPlayer,
  playerIdsInSquads,
  inconsistentSlotNumbers,
} from "./gdtSquadVersioning.js";

/* Última ventana CERRADA del universo (para la reapertura por participante) */
const getLastClosedWindow = (universe, months) => {
  const closed = (universe.changeWindows ?? []).filter(
    (item) => item.status === "final",
  );
  if (closed.length === 0) return null;
  return closed.reduce((max, item) =>
    monthIndexOf(months, item.month) > monthIndexOf(months, max.month)
      ? item
      : max,
  );
};

/* Cambios ya hechos en un mes = diff entre la versión del mes y la vigente
   anterior (para el tope de 2 totales en la reapertura) */
const countMonthChanges = (mySquads, months, month, playerId) => {
  const monthDoc = mySquads.find((squad) => squad.month === month);
  const previousDoc = latestSquadsByPlayer(mySquads, months, {
    beforeMonth: month,
  }).get(String(playerId));
  const mapOf = (squad) =>
    new Map(
      (squad?.slots ?? []).map((slot) => [
        slot.slotNumber,
        String(slot.realPlayer?._id ?? slot.realPlayer),
      ]),
    );
  const current = mapOf(monthDoc);
  const previous = mapOf(previousDoc);
  let changes = 0;
  for (const [slotNumber, playerRef] of current) {
    if (previous.get(slotNumber) !== playerRef) changes += 1;
  }
  return changes;
};

/* Plantel BASE del draft (month: null). Las versiones mensuales de las
   ventanas de cambios llegan en 4.4. */

const getUniverseForParticipant = async (universeId, playerId) => {
  const universe = await GdtUniverse.findById(universeId).populate(
    "tournament",
    "name year months participants",
  );
  if (!universe) throw new Error("Universo GDT no encontrado");

  const participantIds = (universe.tournament?.participants ?? []).map(String);
  if (!participantIds.includes(String(playerId))) {
    const error = new Error(
      "No sos participante del torneo de este universo GDT",
    );
    error.status = 403;
    throw error;
  }
  return universe;
};

/* Decisión del dueño (2026-07-09): el deadline del draft es solo la fecha
   objetivo COMUNICADA (mail y pantallas) — no bloquea nada. El corte real
   es la REVELACIÓN: al salir de "open" la edición se cierra por estado.
   Como el armado es a ciegas, editar "tarde" no da ventaja, y el colgado
   se auto-resuelve completando sin pedirle nada al admin. */
const isDraftEditable = (universe) => universe.draftStatus === "open";

export default class GdtSquadRepository {
  /* --------------- GET MY DRAFT SQUAD --------------- */
  /* Devuelve SOLO el plantel propio: el armado es a ciegas y ningún
     endpoint expone planteles ajenos antes de la revelación (4.3b). */
  getMyDraftSquad = async (universeId, playerId) => {
    const universe = await getUniverseForParticipant(universeId, playerId);

    const squad = await GdtSquad.findOne({
      gdtUniverse: universeId,
      player: playerId,
      month: null,
    }).populate("slots.realPlayer", "name club position photoUrl");

    return {
      universe: {
        _id: universe._id,
        label: universe.label,
        league: universe.league,
        isPrimary: universe.isPrimary,
        draftStatus: universe.draftStatus,
        draftDeadline: universe.draftDeadline,
        tournament: {
          _id: universe.tournament._id,
          name: universe.tournament.name,
          year: universe.tournament.year,
        },
      },
      squad,
      canEdit: isDraftEditable(universe),
    };
  };

  /* --------------- GET REVEALED SQUADS --------------- */
  /* TODOS los planteles del universo — existe recién desde la revelación
     (antes el armado es a ciegas) y solo para participantes del torneo.
     Devuelve además los quemados para marcarlos en la UI. */
  getRevealedSquads = async (universeId, playerId) => {
    const universe = await getUniverseForParticipant(universeId, playerId);

    if (!["revealed", "resolving", "final"].includes(universe.draftStatus)) {
      throw new Error(
        "Los planteles todavía no fueron revelados: hasta la revelación el armado es a ciegas",
      );
    }

    /* pendingReplacements NUNCA viaja acá: las elecciones (de ronda de
       draft o de ventana) son a ciegas — las propias van aparte */
    const months = universe.tournament?.months ?? [];
    const allSquads = await GdtSquad.find({ gdtUniverse: universeId })
      .select("-pendingReplacements")
      .populate("slots.realPlayer", "name club position photoUrl")
      .populate("player", "name");

    /* Se muestra la versión VIGENTE de cada participante */
    const latestMap = latestSquadsByPlayer(allSquads, months);
    const squads = [...latestMap.values()];

    /* El propio primero; el resto alfabético */
    const mine = squads.find(
      (squad) => squadOwnerId(squad) === String(playerId),
    );
    const others = squads
      .filter((squad) => squad !== mine)
      .sort((a, b) =>
        (a.player?.name ?? "").localeCompare(b.player?.name ?? ""),
      );

    /* Mis elecciones a ciegas en curso: ronda del draft (versión base) o
       ventana de cambios (abierta: versión pre-ventana / ronda: versión
       del mes) */
    const roundOpen = universe.draftStatus === "resolving";
    const activeWindow =
      (universe.changeWindows ?? []).find(
        (window) => window.status !== "final",
      ) ?? null;

    let myStaged = [];
    let myWindow = null;
    if (roundOpen) {
      const mySquadWithStaged = await GdtSquad.findOne(
        { gdtUniverse: universeId, player: playerId, month: null },
        { pendingReplacements: 1 },
      ).populate(
        "pendingReplacements.realPlayer",
        "name club position photoUrl",
      );
      myStaged = mySquadWithStaged?.pendingReplacements ?? [];
    } else if (activeWindow) {
      const sourceQuery =
        activeWindow.status === "open"
          ? { gdtUniverse: universeId, player: playerId }
          : {
              gdtUniverse: universeId,
              player: playerId,
              month: activeWindow.month,
            };
      /* Con la ventana abierta la fuente es mi versión vigente (la más
         reciente pre-cierre); en ronda, la versión del mes */
      let sourceDoc;
      if (activeWindow.status === "open") {
        const mySquads = await GdtSquad.find(sourceQuery, {
          month: 1,
          pendingReplacements: 1,
          windowNoChanges: 1,
          windowRetrySlots: 1,
          player: 1,
        }).populate(
          "pendingReplacements.realPlayer",
          "name club position photoUrl",
        );
        sourceDoc = latestSquadsByPlayer(mySquads, months).get(
          String(playerId),
        );
      } else {
        sourceDoc = await GdtSquad.findOne(sourceQuery, {
          pendingReplacements: 1,
          windowNoChanges: 1,
          windowRetrySlots: 1,
        }).populate(
          "pendingReplacements.realPlayer",
          "name club position photoUrl",
        );
      }

      myWindow = {
        month: activeWindow.month,
        deadline: activeWindow.deadline,
        status: activeWindow.status,
        myStaged: sourceDoc?.pendingReplacements ?? [],
        myNoChanges: Boolean(sourceDoc?.windowNoChanges),
        myRetrySlots: sourceDoc?.windowRetrySlots ?? [],
      };
    } else if (universe.draftStatus === "final") {
      /* Sin ventana en curso: ¿me reabrieron la última cerrada? */
      const lastWindow = getLastClosedWindow(universe, months);
      if (
        lastWindow &&
        (lastWindow.reopenedFor ?? [])
          .map(String)
          .includes(String(playerId))
      ) {
        const mySquads = allSquads.filter(
          (squad) => squadOwnerId(squad) === String(playerId),
        );
        const changesMade = countMonthChanges(
          mySquads,
          months,
          lastWindow.month,
          playerId,
        );
        myWindow = {
          month: lastWindow.month,
          deadline: lastWindow.deadline,
          status: "reopened",
          myStaged: [],
          myNoChanges: false,
          myRetrySlots: [],
          myAllowance: Math.max(0, 2 - changesMade),
        };
      }

      /* ¿O tengo una CORRECCIÓN habilitada (error de datos del pool)? */
      if (
        !myWindow &&
        mine &&
        (universe.correctionsFor ?? [])
          .map(String)
          .includes(String(playerId))
      ) {
        myWindow = {
          month: null,
          deadline: null,
          status: "correction",
          myStaged: [],
          myNoChanges: false,
          myRetrySlots: [],
          myCorrectableSlots: [...inconsistentSlotNumbers(mine)],
        };
      }
    }

    return {
      universe: {
        _id: universe._id,
        label: universe.label,
        league: universe.league,
        isPrimary: universe.isPrimary,
        draftStatus: universe.draftStatus,
        draftDeadline: universe.draftDeadline,
        tournament: {
          _id: universe.tournament._id,
          name: universe.tournament.name,
          year: universe.tournament.year,
        },
      },
      burned: (universe.burned ?? []).map(String),
      squads: [...(mine ? [mine] : []), ...others],
      myPlayerId: String(playerId),
      roundOpen,
      myStaged,
      window: myWindow,
    };
  };

  /* --------------- STAGE MY REPLACEMENTS --------------- */
  /* Elección de reemplazos durante una ronda abierta. Se guarda como
     staging (a ciegas) y se aplica recién al cierre. Reglas: solo slots
     con jugador quemado, entrante del pool con la posición del slot, no
     quemado, en NINGÚN plantel del universo (exclusividad total post-
     revelación), sin repetidos y respetando 1-por-club en el plantel
     resultante. Guardado estilo upsert: manda el set completo (parcial o
     vacío para deshacer). */
  stageMyReplacements = async (universeId, playerId, picks) => {
    const universe = await getUniverseForParticipant(universeId, playerId);

    if (universe.draftStatus !== "resolving") {
      throw new Error("La ronda de reemplazos no está abierta");
    }
    if (!Array.isArray(picks)) {
      throw new Error("Formato de reemplazos inválido");
    }

    const squad = await GdtSquad.findOne({
      gdtUniverse: universeId,
      player: playerId,
      month: null,
    }).populate("slots.realPlayer", "name club");
    if (!squad) throw new Error("No tenés plantel en este universo");

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const pendingSlotNumbers = new Set(
      (squad.slots ?? [])
        .filter((slot) => burnedSet.has(String(slot.realPlayer?._id)))
        .map((slot) => slot.slotNumber),
    );

    const slotNumbers = new Set();
    const entrantIds = new Set();
    for (const pick of picks) {
      const slotNumber = Number(pick?.slotNumber);
      if (!pendingSlotNumbers.has(slotNumber)) {
        throw new Error(
          "Solo podés reemplazar slots con un jugador quemado",
        );
      }
      if (slotNumbers.has(slotNumber)) {
        throw new Error("Hay slots repetidos en los reemplazos");
      }
      slotNumbers.add(slotNumber);

      if (!pick?.realPlayer) {
        throw new Error("Cada reemplazo debe tener un jugador elegido");
      }
      if (entrantIds.has(String(pick.realPlayer))) {
        throw new Error("No podés repetir un jugador entre tus reemplazos");
      }
      entrantIds.add(String(pick.realPlayer));
    }

    const entrants = await GdtRealPlayer.find(
      { _id: { $in: [...entrantIds] }, gdtUniverse: universeId },
      { name: 1, club: 1, position: 1 },
    );
    const entrantById = new Map(entrants.map((p) => [String(p._id), p]));

    const normClub = (club) => (club ?? "").trim().toLowerCase();
    /* Clubes del plantel resultante: los slots reemplazados toman el club
       del entrante; los demás (incluidos pendientes sin reemplazar aún)
       conservan el actual */
    const clubBySlot = new Map(
      (squad.slots ?? []).map((slot) => [
        slot.slotNumber,
        normClub(slot.realPlayer?.club),
      ]),
    );

    const validatedPicks = [];
    for (const pick of picks) {
      const slotNumber = Number(pick.slotNumber);
      const entrant = entrantById.get(String(pick.realPlayer));

      if (!entrant) {
        throw new Error(
          "Hay reemplazos que no pertenecen al pool de este universo GDT",
        );
      }
      if (!entrant.position) {
        throw new Error(
          `${entrant.name} no tiene posición asignada y no es elegible`,
        );
      }
      if (entrant.position !== GDT_SLOT_LAYOUT[slotNumber - 1]) {
        throw new Error(
          `${entrant.name} no puede ocupar el slot ${slotNumber}: la posición no coincide`,
        );
      }
      if (burnedSet.has(String(entrant._id))) {
        throw new Error(`${entrant.name} está quemado para todo el torneo`);
      }

      const takenElsewhere = await GdtSquad.exists({
        gdtUniverse: universeId,
        month: null,
        "slots.realPlayer": entrant._id,
      });
      if (takenElsewhere) {
        throw new Error(
          `${entrant.name} ya está en un plantel revelado: post-revelación la exclusividad es total`,
        );
      }

      clubBySlot.set(slotNumber, normClub(entrant.club));
      validatedPicks.push({ slotNumber, realPlayer: entrant._id });
    }

    const clubsSeen = new Map();
    for (const [slotNumber, club] of clubBySlot) {
      if (!club) continue;
      if (clubsSeen.has(club)) {
        throw new Error(
          `Máximo un jugador por club: revisá los reemplazos de los slots ${clubsSeen.get(club)} y ${slotNumber}`,
        );
      }
      clubsSeen.set(club, slotNumber);
    }

    validatedPicks.sort((a, b) => a.slotNumber - b.slotNumber);
    squad.pendingReplacements = validatedPicks;
    await squad.save();

    const updated = await GdtSquad.findById(squad._id, {
      pendingReplacements: 1,
    }).populate("pendingReplacements.realPlayer", "name club position photoUrl");
    return updated?.pendingReplacements ?? [];
  };

  /* --------------- GET ADMIN SQUADS --------------- */
  /* Versiones VIGENTES de todos los planteles para el panel del admin:
     es donde vive el botón de bloqueo puntual. */
  getAdminSquads = async (universeId) => {
    const universe = await GdtUniverse.findById(universeId).populate(
      "tournament",
      "name months participants",
    );
    if (!universe) throw new Error("Universo GDT no encontrado");

    const months = universe.tournament?.months ?? [];
    const squads = await GdtSquad.find({ gdtUniverse: universeId })
      .select("-pendingReplacements")
      .populate("slots.realPlayer", "name club position photoUrl")
      .populate("player", "name");

    const latest = [...latestSquadsByPlayer(squads, months).values()].sort(
      (a, b) => (a.player?.name ?? "").localeCompare(b.player?.name ?? ""),
    );

    /* Quemados con nombre: son una propiedad del TORNEO (draft + ventanas),
       se muestran junto a los planteles vigentes */
    const burnedPlayers =
      (universe.burned ?? []).length > 0
        ? await GdtRealPlayer.find(
            { _id: { $in: universe.burned } },
            { name: 1, club: 1 },
          ).sort({ name: 1 })
        : [];

    return {
      draftStatus: universe.draftStatus,
      burned: (universe.burned ?? []).map(String),
      burnedPlayers,
      correctionsFor: (universe.correctionsFor ?? []).map(String),
      squads: latest,
    };
  };

  /* --------------- SET SLOT BLOCK (admin) --------------- */
  /* Bloqueo puntual: ESE jugador en ESE plantel suma 0 mientras dure
     (mercado de pases que rompe 1-por-club, u otra excepción). Opera sobre
     la versión VIGENTE del participante; reversible. */
  setSlotBlock = async (universeId, playerId, slotNumber, blocked) => {
    const universe = await GdtUniverse.findById(universeId).populate(
      "tournament",
      "months",
    );
    if (!universe) throw new Error("Universo GDT no encontrado");
    if (universe.draftStatus !== "final") {
      throw new Error(
        "El bloqueo aplica sobre planteles definitivos (draft cerrado)",
      );
    }

    const months = universe.tournament?.months ?? [];
    const squads = await GdtSquad.find({
      gdtUniverse: universeId,
      player: playerId,
    });
    const target = latestSquadsByPlayer(squads, months).get(String(playerId));
    if (!target) {
      throw new Error("El participante no tiene plantel en este universo");
    }

    const slot = (target.slots ?? []).find(
      (item) => item.slotNumber === Number(slotNumber),
    );
    if (!slot) throw new Error("Slot inexistente");

    slot.blocked = Boolean(blocked);
    await target.save();
    return target;
  };

  /* --------------- STAGE MY WINDOW CHANGES --------------- */
  /* Cambios de la ventana mensual (hasta 2, a ciegas) o re-elecciones de la
     ronda de la ventana (solo los slots cuyo cambio se quemó). noChanges =
     "confirmar sin cambios" (informativo, solo fase abierta). Reglas del
     entrante: pool del universo, posición del slot, no quemado, en NINGÚN
     plantel vigente (y en ronda tampoco en los pre-ventana: los salientes
     se liberan recién al mes siguiente), 1-por-club contra el plantel
     resultante — tolerando conflictos preexistentes (solo el cambio nuevo
     no puede chocar). Guardado estilo upsert del set completo. */
  stageMyWindowChanges = async (universeId, playerId, { changes, noChanges }) => {
    const universe = await getUniverseForParticipant(universeId, playerId);
    const months = universe.tournament?.months ?? [];
    const window =
      (universe.changeWindows ?? []).find(
        (item) => item.status !== "final",
      ) ?? null;
    if (!window) {
      /* Sin ventana en curso: reapertura de la última cerrada o corrección
         one-shot por error de datos (ambas excepciones del admin) */
      const lastWindow = getLastClosedWindow(universe, months);
      if (
        lastWindow &&
        (lastWindow.reopenedFor ?? [])
          .map(String)
          .includes(String(playerId))
      ) {
        return this.applyReopenedChanges(universe, months, playerId, changes);
      }
      return this.applyCorrectionChanges(universe, months, playerId, changes);
    }

    const isRoundPhase = window.status === "resolving";

    const mySquads = await GdtSquad.find({
      gdtUniverse: universeId,
      player: playerId,
    }).populate("slots.realPlayer", "name club");

    let source;
    if (isRoundPhase) {
      source = mySquads.find((squad) => squad.month === window.month);
      if (!source) throw new Error("No tenés versión del mes en esta ventana");
      if ((source.windowRetrySlots ?? []).length === 0) {
        throw new Error("No tenés re-elecciones pendientes en esta ronda");
      }
    } else {
      source = latestSquadsByPlayer(mySquads, months).get(String(playerId));
      if (!source) throw new Error("No tenés plantel en este universo");
    }

    /* Confirmar sin cambios: informativo, solo mientras la ventana junta
       cambios (en la ronda, no re-elegir YA significa conservar) */
    if (noChanges) {
      if (isRoundPhase) {
        throw new Error(
          "En la ronda de la ventana no hace falta confirmar: si no re-elegís, conservás tu jugador anterior",
        );
      }
      source.pendingReplacements = [];
      source.windowNoChanges = true;
      await source.save();
      return { staged: [], noChanges: true };
    }

    if (!Array.isArray(changes)) {
      throw new Error("Formato de cambios inválido");
    }
    if (!isRoundPhase && changes.length > 2) {
      throw new Error("Máximo 2 cambios por ventana");
    }

    const validSlotNumbers = isRoundPhase
      ? new Set(source.windowRetrySlots ?? [])
      : new Set((source.slots ?? []).map((slot) => slot.slotNumber));

    const slotNumbers = new Set();
    const entrantIds = new Set();
    for (const change of changes) {
      const slotNumber = Number(change?.slotNumber);
      if (!validSlotNumbers.has(slotNumber)) {
        throw new Error(
          isRoundPhase
            ? "Solo podés re-elegir los slots cuyo cambio se quemó"
            : "Uno de los cambios apunta a un slot inexistente",
        );
      }
      if (slotNumbers.has(slotNumber)) {
        throw new Error("Hay slots repetidos entre tus cambios");
      }
      slotNumbers.add(slotNumber);

      if (!change?.realPlayer) {
        throw new Error("Cada cambio debe tener un jugador entrante");
      }
      if (entrantIds.has(String(change.realPlayer))) {
        throw new Error("No podés repetir un entrante entre tus cambios");
      }
      entrantIds.add(String(change.realPlayer));
    }

    const entrants = await GdtRealPlayer.find(
      { _id: { $in: [...entrantIds] }, gdtUniverse: universeId },
      { name: 1, club: 1, position: 1 },
    );
    const entrantById = new Map(entrants.map((p) => [String(p._id), p]));

    /* Exclusividad: nadie que esté en un plantel VIGENTE; en ronda, tampoco
       en los pre-ventana (los salientes de esta ventana siguen vedados) */
    const allSquads = await GdtSquad.find(
      { gdtUniverse: universeId },
      { player: 1, month: 1, slots: 1 },
    );
    const takenIds = playerIdsInSquads([
      ...latestSquadsByPlayer(allSquads, months).values(),
    ]);
    if (isRoundPhase) {
      for (const id of playerIdsInSquads([
        ...latestSquadsByPlayer(allSquads, months, {
          beforeMonth: window.month,
        }).values(),
      ])) {
        takenIds.add(id);
      }
    }

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const normClub = (club) => (club ?? "").trim().toLowerCase();

    /* Clubes del plantel resultante: slots cambiados toman el club del
       entrante; el resto conserva el actual */
    const clubBySlot = new Map(
      (source.slots ?? []).map((slot) => [
        slot.slotNumber,
        normClub(slot.realPlayer?.club),
      ]),
    );

    const validatedPicks = [];
    for (const change of changes) {
      const slotNumber = Number(change.slotNumber);
      const slot = (source.slots ?? []).find(
        (item) => item.slotNumber === slotNumber,
      );
      const entrant = entrantById.get(String(change.realPlayer));

      if (!entrant) {
        throw new Error(
          "Hay entrantes que no pertenecen al pool de este universo GDT",
        );
      }
      if (!entrant.position) {
        throw new Error(
          `${entrant.name} no tiene posición asignada y no es elegible`,
        );
      }
      if (entrant.position !== slot.position) {
        throw new Error(
          `${entrant.name} no puede ocupar el slot ${slotNumber}: la posición no coincide`,
        );
      }
      if (burnedSet.has(String(entrant._id))) {
        throw new Error(`${entrant.name} está quemado para todo el torneo`);
      }
      if (takenIds.has(String(entrant._id))) {
        throw new Error(
          `${entrant.name} no está disponible: está en un plantel vigente o fue saliente de esta ventana`,
        );
      }

      clubBySlot.set(slotNumber, normClub(entrant.club));
      validatedPicks.push({ slotNumber, realPlayer: entrant._id });
    }

    /* 1-por-club solo contra los cambios NUEVOS: un conflicto preexistente
       (mercado de pases) no bloquea el guardado */
    for (const pick of validatedPicks) {
      const entrantClub = clubBySlot.get(pick.slotNumber);
      const clash = [...clubBySlot].some(
        ([slotNumber, club]) =>
          slotNumber !== pick.slotNumber && club && club === entrantClub,
      );
      if (clash) {
        const entrant = entrantById.get(
          String(
            validatedPicks.find((p) => p.slotNumber === pick.slotNumber)
              .realPlayer,
          ),
        );
        throw new Error(
          `Máximo un jugador por club: ${entrant.name} choca con otro de tu plantel`,
        );
      }
    }

    validatedPicks.sort((a, b) => a.slotNumber - b.slotNumber);
    source.pendingReplacements = validatedPicks;
    source.windowNoChanges = false;
    await source.save();

    const updated = await GdtSquad.findById(source._id, {
      pendingReplacements: 1,
    }).populate(
      "pendingReplacements.realPlayer",
      "name club position photoUrl",
    );
    return { staged: updated?.pendingReplacements ?? [], noChanges: false };
  };

  /* --------------- APPLY REOPENED CHANGES --------------- */
  /* Reapertura consumible: los cambios se validan y APLICAN directo sobre
     mi versión del mes (sin staging ni quemas — ya no hay simultaneidad) y
     el guardado consume la reapertura, incluso con cero cambios. Tope: 2
     cambios TOTALES del mes (contando los aplicados antes del cierre);
     salientes de esa ventana vedados también acá. */
  applyReopenedChanges = async (universe, months, playerId, changes) => {
    const lastWindow = getLastClosedWindow(universe, months);
    if (
      !lastWindow ||
      !(lastWindow.reopenedFor ?? []).map(String).includes(String(playerId))
    ) {
      throw new Error("No hay una ventana de cambios en curso");
    }
    if (!Array.isArray(changes)) {
      throw new Error("Formato de cambios inválido");
    }

    const mySquads = await GdtSquad.find({
      gdtUniverse: universe._id,
      player: playerId,
    }).populate("slots.realPlayer", "name club");
    const source = mySquads.find(
      (squad) => squad.month === lastWindow.month,
    );
    if (!source) {
      throw new Error("No tenés versión del mes de esa ventana");
    }

    const changesMade = countMonthChanges(
      mySquads,
      months,
      lastWindow.month,
      playerId,
    );
    const allowance = Math.max(0, 2 - changesMade);
    if (changes.length > allowance) {
      throw new Error(
        allowance === 0
          ? "Ya usaste tus 2 cambios del mes: solo podés cerrar la reapertura sin cambios"
          : `Te queda ${allowance} cambio del mes (ya usaste ${changesMade})`,
      );
    }

    const validSlotNumbers = new Set(
      (source.slots ?? []).map((slot) => slot.slotNumber),
    );
    const slotNumbers = new Set();
    const entrantIds = new Set();
    for (const change of changes) {
      const slotNumber = Number(change?.slotNumber);
      if (!validSlotNumbers.has(slotNumber)) {
        throw new Error("Uno de los cambios apunta a un slot inexistente");
      }
      if (slotNumbers.has(slotNumber)) {
        throw new Error("Hay slots repetidos entre tus cambios");
      }
      slotNumbers.add(slotNumber);
      if (!change?.realPlayer) {
        throw new Error("Cada cambio debe tener un jugador entrante");
      }
      if (entrantIds.has(String(change.realPlayer))) {
        throw new Error("No podés repetir un entrante entre tus cambios");
      }
      entrantIds.add(String(change.realPlayer));
    }

    const entrants = await GdtRealPlayer.find(
      { _id: { $in: [...entrantIds] }, gdtUniverse: universe._id },
      { name: 1, club: 1, position: 1 },
    );
    const entrantById = new Map(entrants.map((p) => [String(p._id), p]));

    /* Exclusividad: planteles vigentes + salientes de esa ventana (los
       pre-ventana), igual que en la ronda */
    const allSquads = await GdtSquad.find(
      { gdtUniverse: universe._id },
      { player: 1, month: 1, slots: 1 },
    );
    const takenIds = playerIdsInSquads([
      ...latestSquadsByPlayer(allSquads, months).values(),
    ]);
    for (const id of playerIdsInSquads([
      ...latestSquadsByPlayer(allSquads, months, {
        beforeMonth: lastWindow.month,
      }).values(),
    ])) {
      takenIds.add(id);
    }

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const normClub = (club) => (club ?? "").trim().toLowerCase();
    const clubBySlot = new Map(
      (source.slots ?? []).map((slot) => [
        slot.slotNumber,
        normClub(slot.realPlayer?.club),
      ]),
    );

    const validated = [];
    for (const change of changes) {
      const slotNumber = Number(change.slotNumber);
      const slot = (source.slots ?? []).find(
        (item) => item.slotNumber === slotNumber,
      );
      const entrant = entrantById.get(String(change.realPlayer));

      if (!entrant) {
        throw new Error(
          "Hay entrantes que no pertenecen al pool de este universo GDT",
        );
      }
      if (!entrant.position) {
        throw new Error(
          `${entrant.name} no tiene posición asignada y no es elegible`,
        );
      }
      if (entrant.position !== slot.position) {
        throw new Error(
          `${entrant.name} no puede ocupar el slot ${slotNumber}: la posición no coincide`,
        );
      }
      if (burnedSet.has(String(entrant._id))) {
        throw new Error(`${entrant.name} está quemado para todo el torneo`);
      }
      if (takenIds.has(String(entrant._id))) {
        throw new Error(
          `${entrant.name} no está disponible: está en un plantel vigente o fue saliente de esa ventana`,
        );
      }
      clubBySlot.set(slotNumber, normClub(entrant.club));
      validated.push({ slotNumber, entrant });
    }

    for (const item of validated) {
      const entrantClub = normClub(item.entrant.club);
      const clash = [...clubBySlot].some(
        ([slotNumber, club]) =>
          slotNumber !== item.slotNumber && club && club === entrantClub,
      );
      if (clash) {
        throw new Error(
          `Máximo un jugador por club: ${item.entrant.name} choca con otro de tu plantel`,
        );
      }
    }

    /* Aplicar directo y CONSUMIR la reapertura */
    for (const item of validated) {
      const slot = (source.slots ?? []).find(
        (candidate) => candidate.slotNumber === item.slotNumber,
      );
      slot.realPlayer = item.entrant._id;
      slot.blocked = false;
    }
    await source.save();

    lastWindow.reopenedFor = (lastWindow.reopenedFor ?? []).filter(
      (id) => String(id) !== String(playerId),
    );
    await universe.save();

    return {
      staged: [],
      noChanges: false,
      reopenedApplied: validated.length,
    };
  };

  /* --------------- APPLY CORRECTION CHANGES --------------- */
  /* Corrección one-shot por error de datos del pool: repone SOLO slots
     inconsistentes de la versión VIGENTE (posición ≠ slot o club duplicado
     tras una corrección del admin), sin gastar cambios mensuales. Guardar
     consume la corrección, incluso con cero cambios. */
  applyCorrectionChanges = async (universe, months, playerId, changes) => {
    if (
      !(universe.correctionsFor ?? [])
        .map(String)
        .includes(String(playerId))
    ) {
      throw new Error("No hay una ventana de cambios en curso");
    }
    if (!Array.isArray(changes)) {
      throw new Error("Formato de cambios inválido");
    }

    const mySquads = await GdtSquad.find({
      gdtUniverse: universe._id,
      player: playerId,
    }).populate("slots.realPlayer", "name club position");
    const source = latestSquadsByPlayer(mySquads, months).get(
      String(playerId),
    );
    if (!source) throw new Error("No tenés plantel en este universo");

    const correctable = inconsistentSlotNumbers(source);

    const slotNumbers = new Set();
    const entrantIds = new Set();
    for (const change of changes) {
      const slotNumber = Number(change?.slotNumber);
      if (!correctable.has(slotNumber)) {
        throw new Error(
          "La corrección solo puede reponer slots inconsistentes",
        );
      }
      if (slotNumbers.has(slotNumber)) {
        throw new Error("Hay slots repetidos entre tus cambios");
      }
      slotNumbers.add(slotNumber);
      if (!change?.realPlayer) {
        throw new Error("Cada cambio debe tener un jugador entrante");
      }
      if (entrantIds.has(String(change.realPlayer))) {
        throw new Error("No podés repetir un entrante entre tus cambios");
      }
      entrantIds.add(String(change.realPlayer));
    }

    const entrants = await GdtRealPlayer.find(
      { _id: { $in: [...entrantIds] }, gdtUniverse: universe._id },
      { name: 1, club: 1, position: 1 },
    );
    const entrantById = new Map(entrants.map((p) => [String(p._id), p]));

    const allSquads = await GdtSquad.find(
      { gdtUniverse: universe._id },
      { player: 1, month: 1, slots: 1 },
    );
    const takenIds = playerIdsInSquads([
      ...latestSquadsByPlayer(allSquads, months).values(),
    ]);

    const burnedSet = new Set((universe.burned ?? []).map(String));
    const normClub = (club) => (club ?? "").trim().toLowerCase();
    const clubBySlot = new Map(
      (source.slots ?? []).map((slot) => [
        slot.slotNumber,
        normClub(slot.realPlayer?.club),
      ]),
    );

    const validated = [];
    for (const change of changes) {
      const slotNumber = Number(change.slotNumber);
      const slot = (source.slots ?? []).find(
        (item) => item.slotNumber === slotNumber,
      );
      const entrant = entrantById.get(String(change.realPlayer));

      if (!entrant) {
        throw new Error(
          "Hay entrantes que no pertenecen al pool de este universo GDT",
        );
      }
      if (!entrant.position) {
        throw new Error(
          `${entrant.name} no tiene posición asignada y no es elegible`,
        );
      }
      if (entrant.position !== slot.position) {
        throw new Error(
          `${entrant.name} no puede ocupar el slot ${slotNumber}: la posición no coincide`,
        );
      }
      if (burnedSet.has(String(entrant._id))) {
        throw new Error(`${entrant.name} está quemado para todo el torneo`);
      }
      if (takenIds.has(String(entrant._id))) {
        throw new Error(
          `${entrant.name} no está disponible: está en un plantel vigente`,
        );
      }
      clubBySlot.set(slotNumber, normClub(entrant.club));
      validated.push({ slotNumber, entrant });
    }

    /* 1-por-club solo contra los cambios nuevos (los conflictos
       preexistentes que NO se reponen acá se toleran) */
    for (const item of validated) {
      const entrantClub = normClub(item.entrant.club);
      const clash = [...clubBySlot].some(
        ([slotNumber, club]) =>
          slotNumber !== item.slotNumber && club && club === entrantClub,
      );
      if (clash) {
        throw new Error(
          `Máximo un jugador por club: ${item.entrant.name} choca con otro de tu plantel`,
        );
      }
    }

    for (const item of validated) {
      const slot = (source.slots ?? []).find(
        (candidate) => candidate.slotNumber === item.slotNumber,
      );
      slot.realPlayer = item.entrant._id;
      slot.blocked = false;
    }
    await source.save();

    universe.correctionsFor = (universe.correctionsFor ?? []).filter(
      (id) => String(id) !== String(playerId),
    );
    await universe.save();

    return {
      staged: [],
      noChanges: false,
      correctionApplied: validated.length,
    };
  };

  /* --------------- UPSERT MY DRAFT SQUAD --------------- */
  /* Guardado tipo borrador: se aceptan planteles parciales (slots sueltos),
     el plantel cuenta como entregado cuando tiene los 11. Validaciones:
     draft abierto + deadline vigente, jugadores del pool DE ESTE universo,
     posición del jugador = posición fija del slot (1-4-4-2), sin repetidos
     y máximo 1 jugador por club real. */
  upsertMyDraftSquad = async (universeId, playerId, slots) => {
    const universe = await getUniverseForParticipant(universeId, playerId);

    if (universe.draftStatus !== "open") {
      throw new Error(
        universe.draftStatus === "setup"
          ? "El draft de este universo todavía no fue abierto"
          : "El draft ya fue revelado: el plantel no puede editarse",
      );
    }

    if (!Array.isArray(slots)) {
      throw new Error("Formato de plantel inválido");
    }
    if (slots.length > 11) {
      throw new Error("El plantel no puede tener más de 11 jugadores");
    }

    const slotNumbers = new Set();
    const playerIds = new Set();
    for (const slot of slots) {
      const slotNumber = Number(slot?.slotNumber);
      if (!Number.isInteger(slotNumber) || slotNumber < 1 || slotNumber > 11) {
        throw new Error("Número de slot inválido");
      }
      if (slotNumbers.has(slotNumber)) {
        throw new Error("Hay slots repetidos en el plantel");
      }
      slotNumbers.add(slotNumber);

      if (!slot?.realPlayer) {
        throw new Error("Cada slot debe tener un jugador elegido");
      }
      if (playerIds.has(String(slot.realPlayer))) {
        throw new Error("No podés repetir un jugador en el plantel");
      }
      playerIds.add(String(slot.realPlayer));
    }

    const poolPlayers = await GdtRealPlayer.find(
      { _id: { $in: [...playerIds] }, gdtUniverse: universeId },
      { name: 1, club: 1, position: 1 },
    );
    const poolById = new Map(poolPlayers.map((p) => [String(p._id), p]));

    const clubsUsed = new Map();
    const validatedSlots = slots.map((slot) => {
      const slotNumber = Number(slot.slotNumber);
      const slotPosition = GDT_SLOT_LAYOUT[slotNumber - 1];
      const realPlayer = poolById.get(String(slot.realPlayer));

      if (!realPlayer) {
        throw new Error(
          "Hay jugadores que no pertenecen al pool de este universo GDT",
        );
      }
      if (!realPlayer.position) {
        throw new Error(
          `${realPlayer.name} no tiene posición asignada y no es elegible en el draft`,
        );
      }
      if (realPlayer.position !== slotPosition) {
        throw new Error(
          `${realPlayer.name} no puede ocupar el slot ${slotNumber}: la posición no coincide`,
        );
      }

      const clubKey = realPlayer.club.trim().toLowerCase();
      if (clubsUsed.has(clubKey)) {
        throw new Error(
          `Máximo un jugador por club: ${realPlayer.name} y ${clubsUsed.get(clubKey)} son de ${realPlayer.club}`,
        );
      }
      clubsUsed.set(clubKey, realPlayer.name);

      return {
        slotNumber,
        position: slotPosition,
        realPlayer: realPlayer._id,
      };
    });

    validatedSlots.sort((a, b) => a.slotNumber - b.slotNumber);

    const squad = await GdtSquad.findOneAndUpdate(
      { gdtUniverse: universeId, player: playerId, month: null },
      { slots: validatedSlots, submittedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate("slots.realPlayer", "name club position photoUrl");

    return squad;
  };
}
