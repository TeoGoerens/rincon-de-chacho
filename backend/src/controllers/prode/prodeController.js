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
      const item = await ProdeTournament.findById(req.params.id).populate(
        "champion lastPlace monthlyWinners.winnerPlayerIds",
      );

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

      // Solo meses habilitados en ese torneo (como definimos)
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
      }).sort({ roundNumber: 1 });

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
      const { duels } = req.body;

      if (!Array.isArray(duels) || duels.length === 0) {
        return res
          .status(400)
          .json({ message: "duels must be a non-empty array" });
      }

      // Validaciones MVP
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
      }

      const uniquePlayers = new Set(playersInDay);

      if (uniquePlayers.size !== playersInDay.length) {
        return res.status(400).json({
          message:
            "A player cannot appear in more than one duel in the same matchday",
        });
      }

      if (uniquePlayers.size % 2 !== 0) {
        return res.status(400).json({
          message: "Number of players in a matchday must be even",
        });
      }

      const updated = await ProdeMatchday.findByIdAndUpdate(
        req.params.id,
        { duels },
        { new: true, runValidators: true },
      );

      if (!updated)
        return res.status(404).json({ message: "ProdeMatchday not found" });

      res.json(updated);
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
