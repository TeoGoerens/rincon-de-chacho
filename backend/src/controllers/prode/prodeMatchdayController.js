import ProdeMatchdayRepository from "../../repository/prode/prodeMatchdayRepository.js";

const repository = new ProdeMatchdayRepository();

const parseDeadline = (value) => {
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) {
    throw new Error("El deadline de pronósticos no es una fecha válida");
  }
  return deadline;
};

const parseKickoff = (value) => {
  const kickoff = new Date(value);
  if (Number.isNaN(kickoff.getTime())) {
    throw new Error("El kickoff del partido no es una fecha válida");
  }
  return kickoff;
};

/* Normaliza tipos del body de un ítem (fechas y números); los campos no
   enviados quedan undefined y el repository decide default o valor previo */
const parseItemPayload = (body) => {
  const toNumber = (value) => (value !== undefined ? Number(value) : undefined);

  if (body.kind === "match") {
    return {
      challenge: body.challenge,
      kind: "match",
      leagueName: body.leagueName,
      homeName: body.homeName,
      awayName: body.awayName,
      kickoffAt:
        body.kickoffAt !== undefined ? parseKickoff(body.kickoffAt) : undefined,
      pointsHome: toNumber(body.pointsHome),
      pointsDraw: toNumber(body.pointsDraw),
      pointsAway: toNumber(body.pointsAway),
    };
  }

  return {
    challenge: body.challenge,
    kind: body.kind,
    questionText: body.questionText,
    pointsCorrect: toNumber(body.pointsCorrect),
  };
};

export default class ProdeMatchdayController {
  /* --------------- CREATE PRODE MATCHDAY --------------- */
  createProdeMatchday = async (req, res, next) => {
    try {
      const { tournament, month, roundNumber, predictionsDeadline, gdtUniverse } =
        req.body;
      if (!tournament) throw new Error("El torneo es obligatorio");
      if (!month) throw new Error("El mes es obligatorio");
      if (!roundNumber || Number.isNaN(Number(roundNumber))) {
        throw new Error("El número de fecha es obligatorio");
      }
      if (!predictionsDeadline) {
        throw new Error("El deadline de pronósticos es obligatorio");
      }

      const matchdayCreated = await repository.createProdeMatchday({
        tournament,
        month,
        roundNumber: Number(roundNumber),
        predictionsDeadline: parseDeadline(predictionsDeadline),
        gdtUniverse: gdtUniverse || null,
      });
      res.status(201).json({
        message: "Prode matchday created successfully",
        matchdayCreated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAYS BY TOURNAMENT --------------- */
  getMatchdaysByTournament = async (req, res, next) => {
    try {
      const matchdays = await repository.getMatchdaysByTournament(
        req.params.tournamentId,
      );
      res.status(200).json({
        message: "Prode matchdays retrieved successfully",
        matchdays,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PRODE MATCHDAY BY ID --------------- */
  getProdeMatchdayById = async (req, res, next) => {
    try {
      const matchday = await repository.getProdeMatchdayById(req.params.id);
      const participantAvatars =
        await repository.getParticipantAvatars(matchday);
      res.status(200).json({
        message: "Prode matchday retrieved successfully",
        matchday,
        participantAvatars,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE MATCHDAY META --------------- */
  updateProdeMatchdayMeta = async (req, res, next) => {
    try {
      const { month, roundNumber, predictionsDeadline, gdtUniverse } = req.body;

      const matchdayUpdated = await repository.updateProdeMatchdayMeta(
        req.params.id,
        {
          month,
          roundNumber:
            roundNumber !== undefined ? Number(roundNumber) : undefined,
          predictionsDeadline:
            predictionsDeadline !== undefined
              ? parseDeadline(predictionsDeadline)
              : undefined,
          /* "" (sin equipo) → null; undefined no toca */
          gdtUniverse: gdtUniverse !== undefined ? gdtUniverse || null : undefined,
        },
      );
      res.status(200).json({
        message: "Prode matchday updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SET MATCHDAY DUELS --------------- */
  setProdeMatchdayDuels = async (req, res, next) => {
    try {
      const { duels } = req.body;
      if (!Array.isArray(duels)) {
        throw new Error("Los duelos deben enviarse como lista");
      }

      const matchdayUpdated = await repository.setProdeMatchdayDuels(
        req.params.id,
        duels,
      );
      res.status(200).json({
        message: "Prode matchday duels updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- OPEN PRODE MATCHDAY --------------- */
  openProdeMatchday = async (req, res, next) => {
    try {
      const { matchday, failedEmails, participantsWithoutUser } =
        await repository.openProdeMatchday(req.params.id);
      res.status(200).json({
        message: "Prode matchday opened successfully",
        matchdayUpdated: matchday,
        failedEmails,
        participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- CONSOLIDATE MATCHDAY --------------- */
  consolidateProdeMatchday = async (req, res, next) => {
    try {
      const { matchday, failedEmails, participantsWithoutUser } =
        await repository.consolidateProdeMatchday(req.params.id);
      res.status(200).json({
        message: "Prode matchday consolidated successfully",
        matchdayUpdated: matchday,
        failedEmails,
        participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- REOPEN CONSOLIDATED MATCHDAY --------------- */
  reopenConsolidatedProdeMatchday = async (req, res, next) => {
    try {
      const matchdayUpdated =
        await repository.reopenConsolidatedProdeMatchday(req.params.id);
      res.status(200).json({
        message: "Prode matchday reopened for correction successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SET GDT SCORES --------------- */
  setProdeMatchdayGdtScores = async (req, res, next) => {
    try {
      const { scores } = req.body;
      const parsed = Array.isArray(scores)
        ? scores.map((score) => ({
            realPlayer: score?.realPlayer,
            points: Number(score?.points),
          }))
        : scores;

      const matchdayUpdated = await repository.setProdeMatchdayGdtScores(
        req.params.id,
        parsed,
      );
      res.status(200).json({
        message: "Prode matchday GDT scores set successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GDT BOARD --------------- */
  getProdeMatchdayGdtBoard = async (req, res, next) => {
    try {
      const board = await repository.getProdeMatchdayGdtBoard(req.params.id);
      res.status(200).json({
        message: "Prode matchday GDT board retrieved successfully",
        board,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SET ITEM RESULT --------------- */
  setProdeMatchdayItemResult = async (req, res, next) => {
    try {
      const toScore = (value) =>
        value === undefined || value === null || value === ""
          ? null
          : Number(value);

      const matchdayUpdated = await repository.setProdeMatchdayItemResult(
        req.params.id,
        req.params.itemId,
        {
          scoreHome: toScore(req.body.scoreHome),
          scoreAway: toScore(req.body.scoreAway),
          officialAnswer: req.body.officialAnswer,
        },
      );
      res.status(200).json({
        message: "Prode matchday item result set successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- REFRESH CATALOG RESULTS --------------- */
  refreshProdeMatchdayResults = async (req, res, next) => {
    try {
      const { matchday, summary } =
        await repository.refreshProdeMatchdayResults(req.params.id);
      res.status(200).json({
        message: "Prode matchday catalog results refreshed successfully",
        matchdayUpdated: matchday,
        summary,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- ANNUL / RESTORE ITEM --------------- */
  annulProdeMatchdayItem = async (req, res, next) => {
    try {
      const { annulled } = req.body;
      if (annulled !== true && annulled !== false) {
        throw new Error("Indicá si el ítem se anula o se restaura");
      }
      const matchdayUpdated = await repository.annulProdeMatchdayItem(
        req.params.id,
        req.params.itemId,
        annulled,
      );
      res.status(200).json({
        message: "Prode matchday item annulment updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- REOPEN MATCHDAY FOR PLAYER --------------- */
  reopenProdeMatchday = async (req, res, next) => {
    try {
      const { playerId } = req.body;
      if (!playerId) {
        throw new Error("Indicá a qué participante reabrirle la carga");
      }
      const matchdayUpdated = await repository.reopenProdeMatchdayFor(
        req.params.id,
        playerId,
      );
      res.status(200).json({
        message: "Prode matchday reopened successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- NOTIFY MATCHDAY CHANGES --------------- */
  notifyProdeMatchdayChanges = async (req, res, next) => {
    try {
      const { failedEmails, participantsWithoutUser } =
        await repository.notifyProdeMatchdayChanges(req.params.id);
      res.status(200).json({
        message: "Prode matchday changes notified successfully",
        failedEmails,
        participantsWithoutUser,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- ADD MATCHDAY ITEM --------------- */
  addProdeMatchdayItem = async (req, res, next) => {
    try {
      const matchdayUpdated = await repository.addProdeMatchdayItem(
        req.params.id,
        parseItemPayload(req.body),
      );
      res.status(201).json({
        message: "Prode matchday item added successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- ADD MATCHDAY ITEMS FROM CATALOG --------------- */
  addProdeMatchdayItemsFromCatalog = async (req, res, next) => {
    try {
      const { challenge, leagueId, providerEventIds } = req.body;
      if (!leagueId) throw new Error("La liga del catálogo es obligatoria");
      if (!Array.isArray(providerEventIds)) {
        throw new Error("Los partidos del catálogo deben enviarse como lista");
      }

      const matchdayUpdated =
        await repository.addProdeMatchdayItemsFromCatalog(req.params.id, {
          challenge,
          leagueId,
          providerEventIds,
        });
      res.status(201).json({
        message: "Prode matchday items added from catalog successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPDATE MATCHDAY ITEM --------------- */
  updateProdeMatchdayItem = async (req, res, next) => {
    try {
      const matchdayUpdated = await repository.updateProdeMatchdayItem(
        req.params.id,
        req.params.itemId,
        parseItemPayload(req.body),
      );
      res.status(200).json({
        message: "Prode matchday item updated successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE MATCHDAY ITEM --------------- */
  deleteProdeMatchdayItem = async (req, res, next) => {
    try {
      const matchdayUpdated = await repository.deleteProdeMatchdayItem(
        req.params.id,
        req.params.itemId,
      );
      res.status(200).json({
        message: "Prode matchday item deleted successfully",
        matchdayUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- DELETE PRODE MATCHDAY --------------- */
  deleteProdeMatchday = async (req, res, next) => {
    try {
      await repository.deleteProdeMatchday(req.params.id);
      res
        .status(200)
        .json({ message: "Prode matchday deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- SUPER DELETE PRODE MATCHDAY (super admin) --------------- */
  superDeleteProdeMatchday = async (req, res, next) => {
    try {
      await repository.superDeleteProdeMatchday(req.params.id);
      res
        .status(200)
        .json({ message: "Prode matchday super deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
