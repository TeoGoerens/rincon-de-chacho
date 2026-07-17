import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import GdtSquad from "../../dao/models/prode/GdtSquadModel.js";
import User from "../../dao/models/userModel.js";
import { PRODE_MONTHS } from "../../dao/models/prode/prodeConstants.js";
/* También registra el modelo para el populate de participants */
import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";

/* Agregaciones públicas de la sección Prode (pestaña Torneo, Etapa 3).
   Fuente de verdad: los duelos de fechas CONSOLIDADAS — duels[].points trae
   los puntos de duelo (3/1/0) y el bonus por separado (0/1), con la misma
   convención en fechas legacy del Excel y en fechas del rebuild
   (verificado contra la base el 2026-07-14).

   participants[] es confiable en TODOS los torneos: los del rebuild lo
   declaran al crearse y los legacy lo recibieron por backfill
   (backfillProdeTournamentParticipants.js — está en el checklist de deploy). */

/* Clave de acumulación por tipo de challenge (los scores de GDT son
   mini-duelos ganados; los de ARG/MISC son puntos de ítems) */
const CHALLENGE_KEYS = { ARG: "arg", MISC: "misc", GDT: "gdt" };

/* Tabla de posiciones a partir de participantes populados (con name) y
   fechas consolidadas. Compartida por la tabla del torneo y el histórico. */
const buildStandingsTable = (participants, matchdays) => {
  const rowsById = new Map();
  for (const participant of participants) {
    const key = String(participant._id);
    if (!rowsById.has(key)) {
      rowsById.set(key, {
        player: { _id: participant._id, name: participant.name },
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        bonus: 0,
        points: 0,
        challenges: { arg: 0, misc: 0, gdt: 0 },
      });
    }
  }

  const getRow = (playerId, md) => {
    const row = rowsById.get(String(playerId));
    if (!row) {
      throw new Error(
        `La fecha ${md.roundNumber} tiene un duelo con un jugador que no está en los participantes del torneo — correr backfillProdeTournamentParticipants.js`,
      );
    }
    return row;
  };

  for (const md of matchdays) {
    for (const duel of md.duels ?? []) {
      if (!duel.duelResult) continue;

      const a = getRow(duel.playerA, md);
      const b = getRow(duel.playerB, md);
      a.played += 1;
      b.played += 1;

      if (duel.duelResult === "A") {
        a.won += 1;
        b.lost += 1;
      } else if (duel.duelResult === "B") {
        b.won += 1;
        a.lost += 1;
      } else {
        a.drawn += 1;
        b.drawn += 1;
      }

      const points = duel.points ?? {};
      a.bonus += points.bonusA ?? 0;
      b.bonus += points.bonusB ?? 0;
      a.points += (points.playerA ?? 0) + (points.bonusA ?? 0);
      b.points += (points.playerB ?? 0) + (points.bonusB ?? 0);

      /* Sumas por desafío: alimentan el desglose de la pestaña Torneo y
         la cadena de desempate */
      for (const challenge of duel.challenges ?? []) {
        const key = CHALLENGE_KEYS[challenge.type];
        if (!key) continue;
        a.challenges[key] += challenge.scoreA ?? 0;
        b.challenges[key] += challenge.scoreB ?? 0;
      }
    }
  }

  /* Eficiencia: puntos de duelo CON bonus sobre el máximo posible sin
     bonus (PJ × 3) — por eso puede superar 100% */
  for (const row of rowsById.values()) {
    row.efficiency = row.played > 0 ? row.points / (row.played * 3) : null;
  }

  /* Cadena de desempate CANÓNICA (acordada con el admin, 2026-07-15):
     pts totales → pts sin bonus → mini-duelos GDT → pts ARG → pts MISC
     → alfabético. Todo derivable de duels[].challenges (cross-era).
     La tabla ya no comparte posiciones: la misma cadena sella los
     honores (comida, organizador, campeón) en 3.5 */
  const standings = [...rowsById.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.points - y.bonus - (x.points - x.bonus) ||
      y.challenges.gdt - x.challenges.gdt ||
      y.challenges.arg - x.challenges.arg ||
      y.challenges.misc - x.challenges.misc ||
      x.player.name.localeCompare(y.player.name, "es"),
  );

  standings.forEach((row, index) => {
    row.position = index + 1;
  });

  return standings;
};

/* ═══ Helpers de la pestaña Records (3.9) ═══ */

/* Mínimo de fechas JUGADAS por el participante en el torneo para contar en
   el récord de eficiencia — sin piso, un 100% en 2 fechas ensuciaría el
   récord (decisión del dueño 2026-07-17: piso de 8 fechas; se exige sobre
   las jugadas por el participante, que es lo que divide la eficiencia) */
const EFFICIENCY_MIN_MATCHDAYS = 8;

/* Orden cronológico de torneos (año → primer mes → creación): las rachas
   de duelos continúan de un torneo al siguiente */
const compareTournamentsChrono = (a, b) => {
  const firstMonthIndex = (tournament) => {
    const indexes = (tournament.months ?? [])
      .map((m) => PRODE_MONTHS.indexOf(m))
      .filter((index) => index !== -1);
    return indexes.length > 0 ? Math.min(...indexes) : 0;
  };
  return (
    (a.year ?? 0) - (b.year ?? 0) ||
    firstMonthIndex(a) - firstMonthIndex(b) ||
    new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)
  );
};

/* Top 3 de un récord: SIEMPRE hasta 3 puestos individuales (decisión del
   dueño 2026-07-17, reemplaza a los puestos compartidos). Ante empate de
   valor gana EL MÁS RECIENTE (order = índice cronológico del evento) y
   alfabético como último recurso. Mantiene el shape {position, value,
   holders[]} con un único holder por puesto — el frontend no cambia. */
const topRecordGroups = (items, { ascending = false, limit = 3 } = {}) =>
  [...items]
    .sort(
      (a, b) =>
        (ascending ? a.value - b.value : b.value - a.value) ||
        (b.order ?? 0) - (a.order ?? 0) ||
        a.player.name.localeCompare(b.player.name, "es"),
    )
    .slice(0, limit)
    .map((item, index) => ({
      position: index + 1,
      value: item.value,
      holders: [
        {
          player: item.player,
          context: item.context ?? null,
          active: item.active === true,
        },
      ],
    }));

export default class ProdeStatsRepository {
  /* --------------- SELLADO DE HONORES MENSUALES (auto-fill) --------------- */
  /* Escribe monthlyWinners con la cadena de desempate (3.5). Un mes queda
     CERRADO cuando existe una fecha de un mes posterior del torneo en
     open/in_play/consolidated — las draft no cuentan jamás (el fixture
     puede precargarse entero en borrador). Con finalize=true (transición
     Finalizar) se sellan todos los meses, incluido el último.
     La entrada de un mes cerrado SE REEMPLAZA en cada barrido → recálculo
     idempotente: reabrir y reconsolidar una fecha de un mes sellado se
     autocorrige sola. Se invoca al abrir y al consolidar cualquier fecha. */
  sealMonthlyHonors = async (tournamentId, { finalize = false } = {}) => {
    const tournament = await ProdeTournament.findById(tournamentId)
      .populate("participants", "name")
      .lean();
    if (!tournament) return;
    const participants = tournament.participants ?? [];

    /* El schema legacy exige exactamente 4 ganadores: con menos de 4
       participantes (solo torneos de prueba) no hay qué sellar */
    if (participants.length < 4) return;

    const matchdays = await ProdeMatchday.find(
      {
        tournament: tournamentId,
        phase: { $in: ["open", "in_play", "consolidated"] },
      },
      { month: 1, duels: 1, phase: 1 },
    ).lean();

    const monthOrder = PRODE_MONTHS.filter((m) =>
      (tournament.months ?? []).includes(m),
    );

    /* Índice del mes más avanzado con actividad no-draft: todo mes
       ANTERIOR a él está cerrado */
    const maxActivityIndex = matchdays.reduce(
      (max, md) => Math.max(max, monthOrder.indexOf(md.month)),
      -1,
    );

    const existingByMonth = new Map(
      (tournament.monthlyWinners ?? []).map((entry) => [entry.month, entry]),
    );

    const sealedEntries = [];
    monthOrder.forEach((month, index) => {
      const isClosed = finalize || index < maxActivityIndex;
      const consolidatedOfMonth = matchdays.filter(
        (md) => md.phase === "consolidated" && md.month === month,
      );

      /* Mes en juego, o cerrado pero sin consolidadas: se conserva lo que
         hubiera (una entrada legacy o cargada a mano no se pisa) */
      if (!isClosed || consolidatedOfMonth.length === 0) {
        const existing = existingByMonth.get(month);
        if (existing) sealedEntries.push(existing);
        return;
      }

      const standings = buildStandingsTable(participants, consolidatedOfMonth);
      sealedEntries.push({
        month,
        winnerPlayerIds: standings.slice(0, 4).map((row) => row.player._id),
        monthlyLoser: standings[standings.length - 1].player._id,
        note: existingByMonth.get(month)?.note ?? "",
      });
    });

    await ProdeTournament.updateOne(
      { _id: tournamentId },
      { $set: { monthlyWinners: sealedEntries } },
    );
    return sealedEntries;
  };

  /* --------------- TABLA DE POSICIONES (acumulada o por mes) --------------- */
  getTournamentStandings = async (tournamentId, { month = null } = {}) => {
    const tournament = await ProdeTournament.findById(tournamentId)
      .populate("participants", "name")
      .populate("monthlyWinners.winnerPlayerIds", "name")
      .populate("monthlyWinners.monthlyLoser", "name")
      .populate("champion", "name")
      .populate("lastPlace", "name")
      .lean();
    if (!tournament) throw new Error("El torneo no existe");

    if (month && !tournament.months.includes(month)) {
      throw new Error(`El mes "${month}" no pertenece a este torneo`);
    }

    /* items con $slice 1: solo hace falta saber si la fecha TIENE ítems
       (las del Excel migrado no tienen — sin tablero que ver) */
    const matchdays = await ProdeMatchday.find(
      { tournament: tournamentId, phase: "consolidated" },
      { month: 1, roundNumber: 1, duels: 1, items: { $slice: 1 } },
    ).lean();

    /* Meses con al menos una fecha consolidada, en orden calendario:
       el frontend habilita/deshabilita las pills con esto */
    const availableMonths = PRODE_MONTHS.filter((m) =>
      matchdays.some((md) => md.month === m),
    );

    const scoped = month
      ? matchdays.filter((md) => md.month === month)
      : matchdays;

    /* Se construye primero: si un duelo tiene un jugador fuera de
       participants[], acá salta el error explícito del backfill */
    const standings = buildStandingsTable(tournament.participants ?? [], scoped);

    /* Duelos del período, fecha por fecha (más reciente primero) — el
       módulo "Duelos del período" de la pestaña Torneo */
    const nameById = new Map(
      (tournament.participants ?? []).map((p) => [String(p._id), p.name]),
    );
    const matchdaysPayload = [...scoped]
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .map((md) => ({
        _id: md._id,
        roundNumber: md.roundNumber,
        month: md.month,
        hasItems: (md.items?.length ?? 0) > 0,
        duels: (md.duels ?? [])
          .filter((duel) => duel.duelResult)
          .map((duel) => ({
            playerA: {
              _id: duel.playerA,
              name: nameById.get(String(duel.playerA)),
            },
            playerB: {
              _id: duel.playerB,
              name: nameById.get(String(duel.playerB)),
            },
            challenges: (duel.challenges ?? []).map(
              ({ type, scoreA, scoreB, result }) => ({
                type,
                scoreA,
                scoreB,
                result,
              }),
            ),
            duelResult: duel.duelResult,
            points: duel.points ?? {},
          })),
      }));

    /* Honores del período (3.5): la entrada sellada del mes que se mira,
       o campeón/último si es la acumulada de un torneo finalizado.
       Los torneos legacy ya traen esta data del Excel → cross-era. */
    const toPlayerRef = (playerDoc) =>
      playerDoc ? { _id: playerDoc._id, name: playerDoc.name } : null;

    let honors = null;
    if (month) {
      const entry = (tournament.monthlyWinners ?? []).find(
        (w) => w.month === month,
      );
      if (entry) {
        honors = {
          month,
          winners: (entry.winnerPlayerIds ?? []).map(toPlayerRef),
          organizer: toPlayerRef(entry.monthlyLoser),
          note: entry.note ?? "",
        };
      }
    } else if (tournament.status === "finished") {
      const champion = toPlayerRef(tournament.champion);
      const lastPlace = toPlayerRef(tournament.lastPlace);
      if (champion || lastPlace) honors = { champion, lastPlace };
    }

    return {
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        year: tournament.year,
        status: tournament.status,
        months: tournament.months,
      },
      month,
      matchdayCount: scoped.length,
      availableMonths,
      standings,
      matchdays: matchdaysPayload,
      honors,
    };
  };

  /* --------------- TABLA HISTÓRICA (todos los torneos sumados) --------------- */
  getAllTimeStandings = async () => {
    const tournaments = await ProdeTournament.find({}, { participants: 1 })
      .populate("participants", "name")
      .lean();

    /* Unión de participantes de todos los torneos (buildStandingsTable
       ignora los repetidos) */
    const participants = tournaments.flatMap((t) => t.participants ?? []);

    const matchdays = await ProdeMatchday.find(
      { phase: "consolidated" },
      { month: 1, roundNumber: 1, duels: 1, tournament: 1 },
    ).lean();

    /* En el histórico, alguien anotado en un torneo que todavía no jugó
       ninguna fecha es ruido: solo se listan los que jugaron */
    const standings = buildStandingsTable(participants, matchdays).filter(
      (row) => row.played > 0,
    );

    const tournamentIdsWithData = new Set(
      matchdays.map((md) => String(md.tournament)),
    );

    return {
      allTime: true,
      tournamentCount: tournamentIdsWithData.size,
      matchdayCount: matchdays.length,
      standings,
    };
  };

  /* --------------- RECORDS HISTÓRICOS (pestaña Records, 3.9) --------------- */
  /* Los récords cross-era se derivan de duels[].challenges de TODAS las
     fechas consolidadas (Excel migrado incluido). Los dos récords de
     plantel GDT son solo-rebuild: nacen de gdtScores + GdtSquad (2026).
     Cada récord devuelve hasta 3 grupos {position, value, holders[]} —
     los empatados comparten fila. */
  getProdeRecords = async () => {
    const [players, tournaments, matchdays, linkedUsers] = await Promise.all([
      ProdePlayer.find({}, { name: 1 }).lean(),
      ProdeTournament.find(
        {},
        {
          name: 1,
          year: 1,
          months: 1,
          status: 1,
          monthlyWinners: 1,
          champion: 1,
          lastPlace: 1,
          createdAt: 1,
        },
      ).lean(),
      ProdeMatchday.find(
        { phase: "consolidated" },
        {
          tournament: 1,
          month: 1,
          roundNumber: 1,
          duels: 1,
          gdtUniverse: 1,
          gdtScores: 1,
        },
      ).lean(),
      /* Foto de perfil vía el user vinculado — el frontend aplica la regla
         pixabay=default y cae a la inicial */
      User.find(
        { prode_player: { $ne: null } },
        { prode_player: 1, profile_picture: 1 },
      ).lean(),
    ]);

    const nameById = new Map(players.map((p) => [String(p._id), p.name]));
    const avatarByPlayer = new Map(
      linkedUsers.map((user) => [
        String(user.prode_player),
        user.profile_picture ?? "",
      ]),
    );
    const playerRef = (playerId) => ({
      _id: playerId,
      name: nameById.get(String(playerId)) ?? "?",
      avatar: avatarByPlayer.get(String(playerId)) ?? "",
    });
    const tournamentById = new Map(tournaments.map((t) => [String(t._id), t]));
    const tournamentName = (tournamentId) =>
      tournamentById.get(String(tournamentId))?.name ?? "?";

    const chronoIndex = new Map(
      [...tournaments]
        .sort(compareTournamentsChrono)
        .map((t, index) => [String(t._id), index]),
    );
    const chronoMatchdays = [...matchdays].sort(
      (a, b) =>
        chronoIndex.get(String(a.tournament)) -
          chronoIndex.get(String(b.tournament)) ||
        a.roundNumber - b.roundNumber,
    );

    /* Fechas consolidadas por torneo: piso del récord de eficiencia */
    const consolidatedByTournament = new Map();
    for (const md of chronoMatchdays) {
      const key = String(md.tournament);
      consolidatedByTournament.set(
        key,
        (consolidatedByTournament.get(key) ?? 0) + 1,
      );
    }

    /* ── Barrido único de duelos: alimenta rachas, palizas, mejores
       fechas/meses/torneos y la tabla por desafío ── */
    const timelineByPlayer = new Map();
    const totalsByTournament = new Map();
    const totalsByMonth = new Map();
    const matchdayItemPoints = [];
    const prodeSumMargins = [];
    const gdtMargins = [];
    const challengeAggByPlayer = new Map();

    const emptyChallengeAgg = () => ({
      played: 0,
      points: 0,
      won: 0,
      drawn: 0,
      lost: 0,
    });
    const getChallengeAgg = (playerId) => {
      let agg = challengeAggByPlayer.get(playerId);
      if (!agg) {
        agg = {
          arg: emptyChallengeAgg(),
          misc: emptyChallengeAgg(),
          gdt: emptyChallengeAgg(),
        };
        challengeAggByPlayer.set(playerId, agg);
      }
      return agg;
    };

    for (const [mdIndex, md] of chronoMatchdays.entries()) {
      const matchdayContext = `Fecha ${md.roundNumber} · ${tournamentName(md.tournament)}`;

      for (const duel of md.duels ?? []) {
        if (!duel.duelResult) continue;

        const sides = [
          {
            me: duel.playerA,
            rival: duel.playerB,
            suffix: "A",
            rivalSuffix: "B",
            outcome:
              duel.duelResult === "A"
                ? "W"
                : duel.duelResult === "B"
                  ? "L"
                  : "D",
          },
          {
            me: duel.playerB,
            rival: duel.playerA,
            suffix: "B",
            rivalSuffix: "A",
            outcome:
              duel.duelResult === "B"
                ? "W"
                : duel.duelResult === "A"
                  ? "L"
                  : "D",
          },
        ];

        for (const side of sides) {
          const playerId = String(side.me);

          /* Timeline cronológica del jugador → rachas */
          let timeline = timelineByPlayer.get(playerId);
          if (!timeline) {
            timeline = [];
            timelineByPlayer.set(playerId, timeline);
          }
          timeline.push({
            outcome: side.outcome,
            tournament: String(md.tournament),
            roundNumber: md.roundNumber,
            order: mdIndex,
          });

          /* Puntos de duelo (con bonus) → mejor mes / mejor torneo */
          const duelPoints =
            (duel.points?.[`player${side.suffix}`] ?? 0) +
            (duel.points?.[`bonus${side.suffix}`] ?? 0);

          const tournamentKey = `${playerId}|${md.tournament}`;
          let tournamentTotal = totalsByTournament.get(tournamentKey);
          if (!tournamentTotal) {
            tournamentTotal = {
              playerId,
              tournamentId: String(md.tournament),
              points: 0,
              played: 0,
            };
            totalsByTournament.set(tournamentKey, tournamentTotal);
          }
          tournamentTotal.points += duelPoints;
          tournamentTotal.played += 1;
          tournamentTotal.order = mdIndex;

          const monthKey = `${playerId}|${md.tournament}|${md.month}`;
          let monthTotal = totalsByMonth.get(monthKey);
          if (!monthTotal) {
            monthTotal = {
              playerId,
              tournamentId: String(md.tournament),
              month: md.month,
              points: 0,
            };
            totalsByMonth.set(monthKey, monthTotal);
          }
          monthTotal.points += duelPoints;
          monthTotal.order = mdIndex;

          /* Challenges: tabla por desafío + palizas + mejor suma de prodes.
             Las palizas se registran solo desde el lado ganador para no
             duplicar el evento. */
          let itemPoints = 0;
          let rivalItemPoints = 0;
          let hasItemScores = false;
          for (const challenge of duel.challenges ?? []) {
            const key = CHALLENGE_KEYS[challenge.type];
            const myScore = challenge[`score${side.suffix}`];
            const rivalScore = challenge[`score${side.rivalSuffix}`];
            if (!key || myScore == null || rivalScore == null) continue;

            const agg = getChallengeAgg(playerId)[key];
            agg.played += 1;
            agg.points += myScore;
            if (myScore > rivalScore) agg.won += 1;
            else if (myScore < rivalScore) agg.lost += 1;
            else agg.drawn += 1;

            if (challenge.type !== "GDT") {
              itemPoints += myScore;
              rivalItemPoints += rivalScore;
              hasItemScores = true;
            } else if (myScore > rivalScore) {
              gdtMargins.push({
                player: playerRef(playerId),
                value: myScore - rivalScore,
                context: `${myScore}–${rivalScore} vs ${
                  nameById.get(String(side.rival)) ?? "?"
                } · ${matchdayContext}`,
                order: mdIndex,
              });
            }
          }
          if (hasItemScores) {
            matchdayItemPoints.push({
              player: playerRef(playerId),
              value: itemPoints,
              context: matchdayContext,
              order: mdIndex,
            });
            /* Paliza en la suma de prodes: diferencia de ARG + RESTO
               juntos en el duelo */
            if (itemPoints > rivalItemPoints) {
              prodeSumMargins.push({
                player: playerRef(playerId),
                value: itemPoints - rivalItemPoints,
                context: `${itemPoints}–${rivalItemPoints} vs ${
                  nameById.get(String(side.rival)) ?? "?"
                } · ${matchdayContext}`,
                order: mdIndex,
              });
            }
          }
        }
      }
    }

    /* ── Rachas: mejor corrida de cada jugador; ante corridas iguales se
       queda la más reciente ── */
    const streakContext = (start, end) => {
      if (start.tournament === end.tournament) {
        return start.roundNumber === end.roundNumber
          ? `Fecha ${start.roundNumber} · ${tournamentName(start.tournament)}`
          : `Fechas ${start.roundNumber}–${end.roundNumber} · ${tournamentName(start.tournament)}`;
      }
      return `Fecha ${start.roundNumber} de ${tournamentName(start.tournament)} → Fecha ${end.roundNumber} de ${tournamentName(end.tournament)}`;
    };

    const streakItems = (predicate) => {
      const items = [];
      for (const [playerId, events] of timelineByPlayer) {
        let best = null;
        let run = 0;
        let start = null;
        for (const event of events) {
          if (predicate(event.outcome)) {
            if (run === 0) start = event;
            run += 1;
            if (!best || run >= best.value) best = { value: run, start, end: event };
          } else {
            run = 0;
          }
        }
        if (best) {
          items.push({
            player: playerRef(playerId),
            value: best.value,
            context: streakContext(best.start, best.end),
            /* Racha VIGENTE: la mejor corrida llega hasta el último duelo
               jugado por el participante (misma referencia de objeto) */
            active: best.end === events[events.length - 1],
            order: best.end.order,
          });
        }
      }
      return items;
    };

    /* ── Mejor torneo y eficiencia récord ── */
    const tournamentItems = [];
    const efficiencyItems = [];
    for (const total of totalsByTournament.values()) {
      tournamentItems.push({
        player: playerRef(total.playerId),
        value: total.points,
        context: tournamentName(total.tournamentId),
        order: total.order,
      });
      if (total.played >= EFFICIENCY_MIN_MATCHDAYS) {
        efficiencyItems.push({
          player: playerRef(total.playerId),
          value: Number((total.points / (total.played * 3)).toFixed(4)),
          context: `${tournamentName(total.tournamentId)} · ${total.played} fechas`,
          order: total.order,
        });
      }
    }

    const monthItems = [...totalsByMonth.values()].map((total) => ({
      player: playerRef(total.playerId),
      value: total.points,
      context: `${total.month} · ${tournamentName(total.tournamentId)}`,
      order: total.order,
    }));

    /* ── Honores acumulados: comidas, organizador, campeón, último —
       la recencia es el orden cronológico del último torneo donde el
       jugador sumó ese honor ── */
    const bumpCount = (map, playerId, order) => {
      const key = String(playerId);
      const entry = map.get(key) ?? { count: 0, order: -1 };
      entry.count += 1;
      entry.order = Math.max(entry.order, order);
      map.set(key, entry);
    };
    const mealCounts = new Map();
    const organizerCounts = new Map();
    const championCounts = new Map();
    const lastPlaceCounts = new Map();
    for (const tournament of tournaments) {
      const order = chronoIndex.get(String(tournament._id)) ?? -1;
      for (const entry of tournament.monthlyWinners ?? []) {
        for (const winner of entry.winnerPlayerIds ?? []) {
          bumpCount(mealCounts, winner, order);
        }
        if (entry.monthlyLoser) {
          bumpCount(organizerCounts, entry.monthlyLoser, order);
        }
      }
      if (tournament.champion) {
        bumpCount(championCounts, tournament.champion, order);
      }
      if (tournament.lastPlace) {
        bumpCount(lastPlaceCounts, tournament.lastPlace, order);
      }
    }
    const countItems = (map) =>
      [...map.entries()].map(([playerId, entry]) => ({
        player: playerRef(playerId),
        value: entry.count,
        context: null,
        order: entry.order,
      }));

    /* ── Puntaje de plantel GDT por fecha (solo-rebuild): versión del
       plantel vigente al mes de la fecha, bloqueados suman 0 ── */
    const gdtMatchdays = chronoMatchdays.filter(
      (md) => md.gdtUniverse && (md.gdtScores?.length ?? 0) > 0,
    );
    const orderByMatchday = new Map(
      chronoMatchdays.map((md, index) => [String(md._id), index]),
    );
    const squadsByUniverse = new Map();
    const squadTotals = [];
    for (const md of gdtMatchdays) {
      const universeKey = String(md.gdtUniverse);
      if (!squadsByUniverse.has(universeKey)) {
        squadsByUniverse.set(
          universeKey,
          await GdtSquad.find(
            { gdtUniverse: md.gdtUniverse },
            { player: 1, month: 1, slots: 1 },
          ).lean(),
        );
      }
      const squads = squadsByUniverse.get(universeKey);

      const months = tournamentById.get(String(md.tournament))?.months ?? [];
      const monthIndex = (month) => (month == null ? -1 : months.indexOf(month));
      const matchdayIndex = monthIndex(md.month);

      /* La versión más reciente ≤ mes de la fecha, por jugador (mismo
         criterio point-in-time que squadsForMatchdayMonth) */
      const latestByPlayer = new Map();
      for (const squad of squads) {
        if (monthIndex(squad.month) > matchdayIndex) continue;
        const key = String(squad.player);
        const previous = latestByPlayer.get(key);
        if (!previous || monthIndex(previous.month) < monthIndex(squad.month)) {
          latestByPlayer.set(key, squad);
        }
      }

      const pointsByRealPlayer = new Map(
        (md.gdtScores ?? []).map((score) => [
          String(score.realPlayer),
          score.points,
        ]),
      );
      const duelPlayers = new Set();
      for (const duel of md.duels ?? []) {
        if (!duel.duelResult) continue;
        duelPlayers.add(String(duel.playerA));
        duelPlayers.add(String(duel.playerB));
      }

      for (const [playerId, squad] of latestByPlayer) {
        if (!duelPlayers.has(playerId)) continue;
        const total = (squad.slots ?? []).reduce(
          (sum, slot) =>
            sum +
            (slot.blocked
              ? 0
              : (pointsByRealPlayer.get(String(slot.realPlayer)) ?? 0)),
          0,
        );
        squadTotals.push({
          player: playerRef(playerId),
          value: total,
          context: `Fecha ${md.roundNumber} · ${tournamentName(md.tournament)}`,
          order: orderByMatchday.get(String(md._id)),
        });
      }
    }

    /* ── Tabla histórica por desafío (todos los nombres): PJ, Pts (en GDT
       son mini-duelos ganados), G/E/P y EF% = (3×G + E) / (3×PJ) — la misma
       lógica 3/1/0 con que se expone la eficiencia en toda la sección
       (decisión del dueño 2026-07-17, reemplaza al G/PJ inicial) ── */
    const withEfficiency = (agg) => ({
      ...agg,
      efficiency:
        agg.played > 0
          ? Number(
              ((3 * agg.won + agg.drawn) / (3 * agg.played)).toFixed(4),
            )
          : null,
    });
    const challengeTable = [...challengeAggByPlayer.entries()]
      .map(([playerId, agg]) => ({
        player: playerRef(playerId),
        arg: withEfficiency(agg.arg),
        misc: withEfficiency(agg.misc),
        gdt: withEfficiency(agg.gdt),
      }))
      .filter((row) => row.arg.played + row.misc.played + row.gdt.played > 0)
      .sort((a, b) => a.player.name.localeCompare(b.player.name, "es"));

    return {
      scope: {
        tournamentCount: consolidatedByTournament.size,
        matchdayCount: chronoMatchdays.length,
        gdtMatchdayCount: gdtMatchdays.length,
      },
      records: {
        winStreak: topRecordGroups(
          streakItems((outcome) => outcome === "W"),
        ),
        unbeatenStreak: topRecordGroups(
          streakItems((outcome) => outcome !== "L"),
        ),
        losingStreak: topRecordGroups(
          streakItems((outcome) => outcome === "L"),
        ),
        biggestProdeMargin: topRecordGroups(prodeSumMargins),
        biggestGdtMargin: topRecordGroups(gdtMargins),
        bestMatchday: topRecordGroups(matchdayItemPoints),
        bestMonth: topRecordGroups(monthItems),
        bestTournament: topRecordGroups(tournamentItems),
        bestEfficiency: topRecordGroups(efficiencyItems),
        mostMeals: topRecordGroups(countItems(mealCounts)),
        mostOrganizer: topRecordGroups(countItems(organizerCounts)),
        mostChampionships: topRecordGroups(countItems(championCounts)),
        mostLastPlaces: topRecordGroups(countItems(lastPlaceCounts)),
        bestSquadScore: topRecordGroups(squadTotals),
        worstSquadScore: topRecordGroups(squadTotals, { ascending: true }),
      },
      challengeTable,
    };
  };

  /* --------------- HEAD TO HEAD (pestaña H2H, 3.11) --------------- */
  /* Historial directo entre dos participantes sobre TODAS las fechas
     consolidadas (cross-era). Todo se expresa desde la perspectiva del
     playerA pedido; el orden dentro del duelo guardado no importa. */
  getProdeH2H = async (playerAId, playerBId) => {
    if (!playerAId || !playerBId) {
      throw new Error("Hay que elegir a los dos participantes del historial");
    }
    if (String(playerAId) === String(playerBId)) {
      throw new Error("Elegí dos participantes distintos");
    }

    const [playerA, playerB, tournaments, matchdays, linkedUsers] =
      await Promise.all([
        ProdePlayer.findById(playerAId, { name: 1 }).lean(),
        ProdePlayer.findById(playerBId, { name: 1 }).lean(),
        ProdeTournament.find(
          {},
          {
            name: 1,
            year: 1,
            months: 1,
            createdAt: 1,
            monthlyWinners: 1,
            champion: 1,
            lastPlace: 1,
          },
        ).lean(),
        ProdeMatchday.find(
          { phase: "consolidated" },
          {
            tournament: 1,
            roundNumber: 1,
            duels: 1,
            items: { $slice: 1 },
          },
        ).lean(),
        /* Foto de perfil vía el user vinculado — el frontend decide si es
           propia o el default y cae a la inicial (misma regla del sitio) */
        User.find(
          { prode_player: { $in: [playerAId, playerBId] } },
          { prode_player: 1, profile_picture: 1 },
        ).lean(),
      ]);
    if (!playerA || !playerB) {
      throw new Error("Alguno de los participantes no existe");
    }

    const avatarByPlayer = new Map(
      linkedUsers.map((user) => [
        String(user.prode_player),
        user.profile_picture ?? "",
      ]),
    );

    const tournamentById = new Map(tournaments.map((t) => [String(t._id), t]));
    const tournamentName = (tournamentId) =>
      tournamentById.get(String(tournamentId))?.name ?? "?";
    const chronoIndex = new Map(
      [...tournaments]
        .sort(compareTournamentsChrono)
        .map((t, index) => [String(t._id), index]),
    );
    const chronoMatchdays = [...matchdays].sort(
      (a, b) =>
        chronoIndex.get(String(a.tournament)) -
          chronoIndex.get(String(b.tournament)) ||
        a.roundNumber - b.roundNumber,
    );

    /* ── Cruces directos, en orden cronológico ── */
    const keyA = String(playerAId);
    const keyB = String(playerBId);
    const crosses = [];
    for (const md of chronoMatchdays) {
      for (const duel of md.duels ?? []) {
        if (!duel.duelResult) continue;
        const duelA = String(duel.playerA);
        const duelB = String(duel.playerB);
        /* Sufijo del playerA pedido dentro del duelo guardado */
        let mySuffix = null;
        if (duelA === keyA && duelB === keyB) mySuffix = "A";
        else if (duelA === keyB && duelB === keyA) mySuffix = "B";
        if (!mySuffix) continue;
        const rivalSuffix = mySuffix === "A" ? "B" : "A";

        const points = duel.points ?? {};
        const challenges = { arg: null, misc: null, gdt: null };
        for (const challenge of duel.challenges ?? []) {
          const key = CHALLENGE_KEYS[challenge.type];
          const a = challenge[`score${mySuffix}`];
          const b = challenge[`score${rivalSuffix}`];
          if (!key || a == null || b == null) continue;
          challenges[key] = { a, b };
        }

        crosses.push({
          matchdayId: md._id,
          roundNumber: md.roundNumber,
          tournamentId: String(md.tournament),
          tournamentName: tournamentName(md.tournament),
          hasItems: (md.items?.length ?? 0) > 0,
          outcome:
            duel.duelResult === "draw"
              ? "D"
              : duel.duelResult === mySuffix
                ? "W"
                : "L",
          pointsA:
            (points[`player${mySuffix}`] ?? 0) +
            (points[`bonus${mySuffix}`] ?? 0),
          pointsB:
            (points[`player${rivalSuffix}`] ?? 0) +
            (points[`bonus${rivalSuffix}`] ?? 0),
          bonusA: (points[`bonus${mySuffix}`] ?? 0) > 0,
          bonusB: (points[`bonus${rivalSuffix}`] ?? 0) > 0,
          challenges,
        });
      }
    }

    /* ── Resumen del cara a cara ── */
    const summary = {
      crosses: crosses.length,
      winsA: crosses.filter((c) => c.outcome === "W").length,
      draws: crosses.filter((c) => c.outcome === "D").length,
      winsB: crosses.filter((c) => c.outcome === "L").length,
      pointsA: crosses.reduce((sum, c) => sum + c.pointsA, 0),
      pointsB: crosses.reduce((sum, c) => sum + c.pointsB, 0),
      since: crosses.length > 0 ? crosses[0].tournamentName : null,
    };

    /* ── Balance por desafío ── */
    const challengeBalance = {};
    for (const key of ["arg", "misc", "gdt"]) {
      const balance = {
        played: 0,
        winsA: 0,
        draws: 0,
        winsB: 0,
        pointsA: 0,
        pointsB: 0,
      };
      for (const cross of crosses) {
        const scores = cross.challenges[key];
        if (!scores) continue;
        balance.played += 1;
        balance.pointsA += scores.a;
        balance.pointsB += scores.b;
        if (scores.a > scores.b) balance.winsA += 1;
        else if (scores.a < scores.b) balance.winsB += 1;
        else balance.draws += 1;
      }
      challengeBalance[key] = balance;
    }

    /* ── Rachas del cruce (los empates cortan) ── */
    const crossRangeContext = (start, end) => {
      if (start.tournamentId === end.tournamentId) {
        return start.roundNumber === end.roundNumber
          ? `Fecha ${start.roundNumber} · ${start.tournamentName}`
          : `Fechas ${start.roundNumber}–${end.roundNumber} · ${start.tournamentName}`;
      }
      return `Fecha ${start.roundNumber} de ${start.tournamentName} → Fecha ${end.roundNumber} de ${end.tournamentName}`;
    };

    const bestRunOf = (outcome) => {
      let best = null;
      let run = 0;
      let start = null;
      for (const cross of crosses) {
        if (cross.outcome === outcome) {
          if (run === 0) start = cross;
          run += 1;
          if (!best || run >= best.length) best = { length: run, start, end: cross };
        } else {
          run = 0;
        }
      }
      return best
        ? { length: best.length, context: crossRangeContext(best.start, best.end) }
        : null;
    };

    let currentStreak = null;
    const lastOutcome = crosses[crosses.length - 1]?.outcome;
    if (lastOutcome === "W" || lastOutcome === "L") {
      let length = 0;
      for (let i = crosses.length - 1; i >= 0; i -= 1) {
        if (crosses[i].outcome !== lastOutcome) break;
        length += 1;
      }
      currentStreak = { winner: lastOutcome === "W" ? "A" : "B", length };
    }

    /* ── Momentos del cruce: palizas y bonus ── */
    const biggestMoment = (sumOf) => {
      let best = null;
      for (const cross of crosses) {
        const sums = sumOf(cross);
        if (!sums) continue;
        const margin = Math.abs(sums.a - sums.b);
        if (margin === 0) continue;
        if (!best || margin > best.margin) {
          best = {
            winner: sums.a > sums.b ? "A" : "B",
            margin,
            winnerScore: Math.max(sums.a, sums.b),
            loserScore: Math.min(sums.a, sums.b),
            context: `Fecha ${cross.roundNumber} · ${cross.tournamentName}`,
          };
        }
      }
      return best;
    };

    const moments = {
      biggestProdeMargin: biggestMoment((cross) => {
        if (!cross.challenges.arg && !cross.challenges.misc) return null;
        return {
          a: (cross.challenges.arg?.a ?? 0) + (cross.challenges.misc?.a ?? 0),
          b: (cross.challenges.arg?.b ?? 0) + (cross.challenges.misc?.b ?? 0),
        };
      }),
      biggestGdtMargin: biggestMoment((cross) => cross.challenges.gdt),
      bonusWinsA: crosses.filter((c) => c.bonusA).length,
      bonusWinsB: crosses.filter((c) => c.bonusB).length,
    };

    /* ── Palmarés individual de cada uno (no es head-to-head: títulos,
       últimos de torneo, comidas y organizadas de TODA su historia) ── */
    const honorsFor = (playerId) => {
      const key = String(playerId);
      const honors = {
        championships: 0,
        tournamentLastPlaces: 0,
        meals: 0,
        organized: 0,
      };
      for (const tournament of tournaments) {
        if (String(tournament.champion) === key) honors.championships += 1;
        if (String(tournament.lastPlace) === key) {
          honors.tournamentLastPlaces += 1;
        }
        for (const entry of tournament.monthlyWinners ?? []) {
          if (
            (entry.winnerPlayerIds ?? []).some((id) => String(id) === key)
          ) {
            honors.meals += 1;
          }
          if (String(entry.monthlyLoser) === key) honors.organized += 1;
        }
      }
      return honors;
    };

    return {
      playerA: {
        _id: playerA._id,
        name: playerA.name,
        avatar: avatarByPlayer.get(keyA) ?? "",
      },
      playerB: {
        _id: playerB._id,
        name: playerB.name,
        avatar: avatarByPlayer.get(keyB) ?? "",
      },
      honors: { a: honorsFor(playerAId), b: honorsFor(playerBId) },
      summary,
      challenges: challengeBalance,
      streaks: {
        current: currentStreak,
        bestA: bestRunOf("W"),
        bestB: bestRunOf("L"),
      },
      moments,
      /* Más reciente primero — el frontend muestra 10 y expande el resto */
      crosses: [...crosses]
        .reverse()
        .map(({ tournamentId, ...cross }) => cross),
    };
  };
}
