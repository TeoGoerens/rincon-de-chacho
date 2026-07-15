import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";
import { PRODE_MONTHS } from "../../dao/models/prode/prodeConstants.js";
/* Registro del modelo para el populate de participants */
import "../../dao/models/prode/ProdePlayerModel.js";

/* Agregaciones públicas de la sección Prode (pestaña Torneo, Etapa 3).
   Fuente de verdad: los duelos de fechas CONSOLIDADAS — duels[].points trae
   los puntos de duelo (3/1/0) y el bonus por separado (0/1), con la misma
   convención en fechas legacy del Excel y en fechas del rebuild
   (verificado contra la base el 2026-07-14).

   participants[] es confiable en TODOS los torneos: los del rebuild lo
   declaran al crearse y los legacy lo recibieron por backfill
   (backfillProdeTournamentParticipants.js — está en el checklist de deploy). */

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
    }
  }

  const standings = [...rowsById.values()].sort(
    (x, y) =>
      y.points - x.points || x.player.name.localeCompare(y.player.name, "es"),
  );

  /* Posición estilo competencia: empatados en puntos COMPARTEN el puesto
     (1,2,2,4) — los desempates de honores son manuales del admin, la
     tabla nunca decide un empate */
  let lastPoints = null;
  let lastPosition = 0;
  standings.forEach((row, index) => {
    if (row.points !== lastPoints) {
      lastPosition = index + 1;
      lastPoints = row.points;
    }
    row.position = lastPosition;
  });

  return standings;
};

export default class ProdeStatsRepository {
  /* --------------- TABLA DE POSICIONES (acumulada o por mes) --------------- */
  getTournamentStandings = async (tournamentId, { month = null } = {}) => {
    const tournament = await ProdeTournament.findById(tournamentId)
      .populate("participants", "name")
      .lean();
    if (!tournament) throw new Error("El torneo no existe");

    if (month && !tournament.months.includes(month)) {
      throw new Error(`El mes "${month}" no pertenece a este torneo`);
    }

    const matchdays = await ProdeMatchday.find(
      { tournament: tournamentId, phase: "consolidated" },
      { month: 1, roundNumber: 1, duels: 1 },
    ).lean();

    /* Meses con al menos una fecha consolidada, en orden calendario:
       el frontend habilita/deshabilita las pills con esto */
    const availableMonths = PRODE_MONTHS.filter((m) =>
      matchdays.some((md) => md.month === m),
    );

    const scoped = month
      ? matchdays.filter((md) => md.month === month)
      : matchdays;

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
      standings: buildStandingsTable(tournament.participants ?? [], scoped),
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
}
