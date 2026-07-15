import ProdePredictionRepository from "../../repository/prode/prodePredictionRepository.js";

const repository = new ProdePredictionRepository();

/* Normaliza tipos del body de un pick: los números pueden llegar como string
   y los campos vacíos como null/undefined/"" */
const parsePicksPayload = (picks) => {
  if (!Array.isArray(picks)) return picks;

  const toScore = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return Number(value);
  };

  return picks.map((pick) => ({
    item: pick.item,
    pick1x2: pick.pick1x2 || null,
    predictedHome: toScore(pick.predictedHome),
    predictedAway: toScore(pick.predictedAway),
    answerText: pick.answerText,
  }));
};

export default class ProdePredictionController {
  /* --------------- GET MY PREDICTION --------------- */
  getMyPrediction = async (req, res, next) => {
    try {
      const prediction = await repository.getMyPrediction(
        req.params.id,
        req.prodePlayerId,
      );
      res.status(200).json({
        message: "Prode prediction retrieved successfully",
        prediction,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAY PREDICTIONS (todos) --------------- */
  getMatchdayPredictions = async (req, res, next) => {
    try {
      const predictions = await repository.getMatchdayPredictions(
        req.params.id,
        req.prodePlayerId,
      );
      res.status(200).json({
        message: "Prode matchday predictions retrieved successfully",
        predictions,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAY PREDICTIONS (admin) --------------- */
  getMatchdayPredictionsAdmin = async (req, res, next) => {
    try {
      const predictions = await repository.getMatchdayPredictionsAdmin(
        req.params.id,
      );
      res.status(200).json({
        message: "Prode matchday predictions retrieved successfully",
        predictions,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET PREDICTION OVERVIEW (admin) --------------- */
  getMatchdayPredictionOverview = async (req, res, next) => {
    try {
      const overview = await repository.getMatchdayPredictionOverview(
        req.params.id,
      );
      res.status(200).json({
        message: "Prode matchday prediction overview retrieved successfully",
        overview,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- JUDGE QUESTION --------------- */
  judgeProdeQuestion = async (req, res, next) => {
    try {
      const result = await repository.judgeProdeQuestion(
        req.params.id,
        req.params.itemId,
        req.body.verdicts,
      );
      res.status(200).json({
        message: "Prode question judged successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAY PARTIALS --------------- */
  getMatchdayPartials = async (req, res, next) => {
    try {
      const partials = await repository.getMatchdayPartials(
        req.params.id,
        req.prodePlayerId,
      );
      res.status(200).json({
        message: "Prode matchday partials retrieved successfully",
        partials,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- GET MATCHDAY PARTIALS (admin) --------------- */
  getMatchdayPartialsAdmin = async (req, res, next) => {
    try {
      const partials = await repository.getMatchdayPartialsAdmin(
        req.params.id,
      );
      res.status(200).json({
        message: "Prode matchday partials retrieved successfully",
        partials,
      });
    } catch (error) {
      next(error);
    }
  };

  /* --------------- UPSERT MY PREDICTION --------------- */
  upsertMyPrediction = async (req, res, next) => {
    try {
      /* El jugador sale SIEMPRE del JWT resuelto por el middleware,
         nunca del body */
      const prediction = await repository.upsertMyPrediction(
        req.params.id,
        req.prodePlayerId,
        parsePicksPayload(req.body.picks),
      );
      res.status(200).json({
        message: "Prode prediction saved successfully",
        prediction,
      });
    } catch (error) {
      next(error);
    }
  };
}
