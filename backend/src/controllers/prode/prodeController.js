import ProdePlayer from "../../dao/models/prode/ProdePlayerModel.js";
import ProdeTournament from "../../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../../dao/models/prode/ProdeMatchdayModel.js";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CHALLENGE_TYPES = ["GDT", "ARG", "MISC"];

export default class ProdeController {
  /* ---------- PLAYERS ---------- */
  createProdePlayer = async (req, res, next) => {
    try {
      const { name, active } = req.body;
      const created = await ProdePlayer.create({ name, active });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  getProdePlayerById = async (req, res, next) => {
    try {
      const item = await ProdePlayer.findById(req.params.id);
      if (!item)
        return res.status(404).json({ message: "ProdePlayer not found" });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  getAllProdePlayers = async (req, res, next) => {
    try {
      const items = await ProdePlayer.find().sort({ name: 1 });
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  updateProdePlayer = async (req, res, next) => {
    try {
      const updated = await ProdePlayer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      );
      if (!updated)
        return res.status(404).json({ message: "ProdePlayer not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  deleteProdePlayer = async (req, res, next) => {
    try {
      const deleted = await ProdePlayer.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "ProdePlayer not found" });
      res.json({ message: "ProdePlayer deleted" });
    } catch (err) {
      next(err);
    }
  };

  /* ---------- TOURNAMENTS ---------- */
  createProdeTournament = async (req, res, next) => {
    try {
      const { months } = req.body;

      if (!Array.isArray(months) || months.length === 0) {
        return res
          .status(400)
          .json({ message: "months must be a non-empty array" });
      }

      const invalid = months.filter((m) => !MONTHS.includes(m));
      if (invalid.length) {
        return res.status(400).json({
          message: "Invalid months provided",
          invalidMonths: invalid,
        });
      }

      const created = await ProdeTournament.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  getProdeTournamentById = async (req, res, next) => {
    try {
      // ✅ populate defensivo + claro
      const item = await ProdeTournament.findById(req.params.id).populate([
        { path: "champion", model: "ProdePlayer" },
        { path: "lastPlace", model: "ProdePlayer" },
        { path: "monthlyWinners.winnerPlayerIds", model: "ProdePlayer" },
      ]);

      if (!item)
        return res.status(404).json({ message: "ProdeTournament not found" });

      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  getAllProdeTournaments = async (req, res, next) => {
    try {
      const items = await ProdeTournament.find().sort({
        year: -1,
        createdAt: -1,
      });
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  updateProdeTournament = async (req, res, next) => {
    try {
      if (req.body.months !== undefined) {
        const { months } = req.body;

        if (!Array.isArray(months) || months.length === 0) {
          return res
            .status(400)
            .json({ message: "months must be a non-empty array" });
        }

        const invalid = months.filter((m) => !MONTHS.includes(m));
        if (invalid.length) {
          return res.status(400).json({
            message: "Invalid months provided",
            invalidMonths: invalid,
          });
        }
      }

      const updated = await ProdeTournament.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      );

      if (!updated)
        return res.status(404).json({ message: "ProdeTournament not found" });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  deleteProdeTournament = async (req, res, next) => {
    try {
      const deleted = await ProdeTournament.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ message: "ProdeTournament not found" });
      res.json({ message: "ProdeTournament deleted" });
    } catch (err) {
      next(err);
    }
  };

  /* ---------- MONTHLY WINNERS ---------- */
  upsertMonthlyWinners = async (req, res, next) => {
    try {
      const { month, winnerPlayerIds, note } = req.body;

      if (!MONTHS.includes(month)) {
        return res.status(400).json({ message: "Invalid month" });
      }

      if (!Array.isArray(winnerPlayerIds) || winnerPlayerIds.length !== 4) {
        return res.status(400).json({
          message: "winnerPlayerIds must be an array of exactly 4 playerIds",
        });
      }

      const unique = new Set(winnerPlayerIds.map(String));
      if (unique.size !== 4) {
        return res.status(400).json({
          message: "winnerPlayerIds must contain 4 distinct players",
        });
      }

      const tournament = await ProdeTournament.findById(req.params.id);
      if (!tournament)
        return res.status(404).json({ message: "ProdeTournament not found" });

      if (!tournament.months.includes(month)) {
        return res.status(400).json({
          message: "Month not enabled for this tournament",
        });
      }

      const idx = tournament.monthlyWinners.findIndex(
        (mw) => mw.month === month,
      );

      if (idx >= 0) {
        tournament.monthlyWinners[idx].winnerPlayerIds = winnerPlayerIds;
        tournament.monthlyWinners[idx].note =
          note ?? tournament.monthlyWinners[idx].note;
      } else {
        tournament.monthlyWinners.push({ month, winnerPlayerIds, note });
      }

      await tournament.save();
      res.json(tournament.monthlyWinners);
    } catch (err) {
      next(err);
    }
  };

  deleteMonthlyWinnersByMonth = async (req, res, next) => {
    try {
      const { id, month } = req.params;

      const tournament = await ProdeTournament.findById(id);
      if (!tournament)
        return res.status(404).json({ message: "ProdeTournament not found" });

      tournament.monthlyWinners = tournament.monthlyWinners.filter(
        (mw) => mw.month !== month,
      );

      await tournament.save();
      res.json(tournament.monthlyWinners);
    } catch (err) {
      next(err);
    }
  };

  /* ---------- MATCHDAYS ---------- */
  getMatchdaysByTournament = async (req, res, next) => {
    try {
      const { tournamentId } = req.params;

      const items = await ProdeMatchday.find({
        tournament: tournamentId,
      }).sort({ roundNumber: -1 });

      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  createProdeMatchday = async (req, res, next) => {
    try {
      if (req.body.month && !MONTHS.includes(req.body.month)) {
        return res.status(400).json({ message: "Invalid month" });
      }

      const created = await ProdeMatchday.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  getProdeMatchdayById = async (req, res, next) => {
    try {
      const item = await ProdeMatchday.findById(req.params.id)
        .populate("tournament")
        .populate("duels.playerA duels.playerB");

      if (!item)
        return res.status(404).json({ message: "ProdeMatchday not found" });

      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  updateProdeMatchdayMeta = async (req, res, next) => {
    try {
      const { tournament, month, roundNumber, status, playedAt } = req.body;

      if (month !== undefined && !MONTHS.includes(month)) {
        return res.status(400).json({ message: "Invalid month" });
      }

      const patch = {};
      if (tournament !== undefined) patch.tournament = tournament;
      if (month !== undefined) patch.month = month;
      if (roundNumber !== undefined) patch.roundNumber = roundNumber;
      if (status !== undefined) patch.status = status;
      if (playedAt !== undefined) patch.playedAt = playedAt;

      const updated = await ProdeMatchday.findByIdAndUpdate(
        req.params.id,
        patch,
        { new: true, runValidators: true },
      );

      if (!updated)
        return res.status(404).json({ message: "ProdeMatchday not found" });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  updateProdeMatchdayFull = async (req, res, next) => {
    try {
      const { duels, status } = req.body;

      // ✅ Permitimos fixture vacío: duels puede ser []
      if (!Array.isArray(duels)) {
        return res.status(400).json({ message: "duels must be an array" });
      }

      const matchday = await ProdeMatchday.findById(req.params.id);
      if (!matchday)
        return res.status(404).json({ message: "ProdeMatchday not found" });

      // Si viene status en body, lo usamos (y lo guardamos).
      const finalStatus = status || matchday.status || "scheduled";
      if (!["scheduled", "played"].includes(finalStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // ---------- helpers ----------
      const calcChallengeResult = (a, b) => {
        if (a > b) return "A";
        if (b > a) return "B";
        return "draw";
      };

      const countResults = (challengeResults) => {
        let aWins = 0;
        let bWins = 0;
        let draws = 0;

        for (const r of challengeResults) {
          if (r === "A") aWins += 1;
          else if (r === "B") bWins += 1;
          else draws += 1;
        }

        return { aWins, bWins, draws };
      };

      const calcDuelResultFromCounts = ({ aWins, bWins }) => {
        if (aWins > bWins) return "A";
        if (bWins > aWins) return "B";
        return "draw";
      };

      const calcPointsFromDuelResult = (duelResult) => {
        // ✅ Regla base simple (ajustable):
        // win=3, draw=1, lose=0
        if (duelResult === "A") return { playerA: 3, playerB: 0 };
        if (duelResult === "B") return { playerA: 0, playerB: 3 };
        return { playerA: 1, playerB: 1 };
      };

      const calcBonusFromCounts = ({ aWins, bWins }) => {
        // ✅ BONUS por 3-0
        // Si querés otra regla (por ej +2), se cambia acá.
        if (aWins === 3) return { bonusA: 1, bonusB: 0 };
        if (bWins === 3) return { bonusA: 0, bonusB: 1 };
        return { bonusA: 0, bonusB: 0 };
      };

      // ---------- Validaciones + normalización ----------
      const playersInDay = [];

      for (const d of duels) {
        if (!d.playerA || !d.playerB) {
          return res.status(400).json({
            message: "Each duel must have playerA and playerB",
          });
        }

        playersInDay.push(String(d.playerA), String(d.playerB));

        if (!Array.isArray(d.challenges) || d.challenges.length !== 3) {
          return res.status(400).json({
            message: "Each duel must have exactly 3 challenges",
          });
        }

        // Validar tipos
        const types = d.challenges.map((c) => c.type);
        const uniqueTypes = new Set(types);

        if (uniqueTypes.size !== 3) {
          return res.status(400).json({
            message: "Challenge types must be unique per duel",
          });
        }

        for (const t of uniqueTypes) {
          if (!CHALLENGE_TYPES.includes(t)) {
            return res.status(400).json({ message: "Invalid challenge type" });
          }
        }

        // ✅ Si played: exigir scores y calcular resultados
        if (finalStatus === "played") {
          for (const c of d.challenges) {
            const hasScores =
              typeof c.scoreA === "number" && typeof c.scoreB === "number";

            if (!hasScores) {
              return res.status(400).json({
                message:
                  "If matchday is played, each challenge must include scoreA and scoreB",
              });
            }

            // calcular result
            c.result = calcChallengeResult(c.scoreA, c.scoreB);
          }

          const results = d.challenges.map((c) => c.result);
          const counts = countResults(results);

          d.duelResult = calcDuelResultFromCounts(counts);

          const basePoints = calcPointsFromDuelResult(d.duelResult);
          const bonus = calcBonusFromCounts(counts);

          // ✅ Acá está el fix: bonus se calcula SIEMPRE en el back
          d.points = {
            playerA: basePoints.playerA,
            playerB: basePoints.playerB,
            bonusA: bonus.bonusA,
            bonusB: bonus.bonusB,
          };
        } else {
          // ✅ scheduled: fixture => limpiamos resultados
          for (const c of d.challenges) {
            c.result = null;
          }
          d.duelResult = null;

          d.points = {
            playerA: 0,
            playerB: 0,
            bonusA: 0,
            bonusB: 0,
          };
        }
      }

      // No repetir jugadores en la misma fecha
      const uniquePlayers = new Set(playersInDay);
      if (uniquePlayers.size !== playersInDay.length) {
        return res.status(400).json({
          message:
            "A player cannot appear in more than one duel in the same matchday",
        });
      }

      // Cantidad par de jugadores (si hay duels)
      if (uniquePlayers.size > 0 && uniquePlayers.size % 2 !== 0) {
        return res.status(400).json({
          message: "Number of players in a matchday must be even",
        });
      }

      // ✅ Persistimos
      matchday.duels = duels;
      matchday.status = finalStatus;

      const saved = await matchday.save();
      res.json(saved);
    } catch (err) {
      next(err);
    }
  };

  deleteProdeMatchday = async (req, res, next) => {
    try {
      const deleted = await ProdeMatchday.findByIdAndDelete(req.params.id);

      if (!deleted)
        return res.status(404).json({ message: "ProdeMatchday not found" });

      res.json({ message: "ProdeMatchday deleted" });
    } catch (err) {
      next(err);
    }
  };

  getProdeConstants = async (req, res, next) => {
    try {
      res.json({
        months: MONTHS,
        challengeTypes: CHALLENGE_TYPES,
        tournamentStatuses: ["draft", "active", "finished"],
        matchdayStatuses: ["scheduled", "played"],
      });
    } catch (err) {
      next(err);
    }
  };
}
