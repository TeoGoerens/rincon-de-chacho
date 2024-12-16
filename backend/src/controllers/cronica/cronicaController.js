import CronicaRepository from "../../repository/cronica/cronicaRepository.js";
const repository = new CronicaRepository();

export default class CronicaController {
  // ---------- GET CRONICA BY ID ----------
  getCronicaById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;
      const cronica = await repository.getCronicaById(cronicaId);

      res.status(200).json({
        message: `Cronica with id ${cronicaId} has been properly retrieved`,
        cronica,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- GET ALL CRONICAS ----------
  getAllCronicas = async (req, res, next) => {
    try {
      const cronicas = await repository.getAllCronicas();

      res.status(200).json({
        message: "All cronicas have been properly retrieved",
        cronicas,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE CRONICA ----------
  createCronica = async (req, res, next) => {
    try {
      const cronicaBody = req.body;
      const cronicaFiles = req.files;

      const cronicaLoaded = await repository.createCronica(
        cronicaBody,
        cronicaFiles
      );

      res.status(200).json({
        message: "La crónica ha sido creada exitosamente",
        cronicaLoaded,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE CRONICA BY ID ----------
  updateCronicaById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;
      const cronicaBody = req.body;
      const cronicaFiles = req.files;

      const cronicaUpdated = await repository.updateCronicaById(
        cronicaId,
        cronicaBody,
        cronicaFiles
      );

      res.status(200).json({
        message: `La crónica ha sido actualizada correctamente`,
        cronicaUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE CRONICA LIKES ----------
  updateCronicaLikesById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;
      const userId = req.user.id;

      const cronicaUpdated = await repository.updateCronicaLikesById(
        cronicaId,
        userId
      );

      res.status(200).json({
        message: `Likes have been updated on cronica with id ${cronicaId}`,
        cronicaUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE CRONICA VIEWS ----------
  updateCronicaViewsById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;

      const cronicaUpdated = await repository.updateCronicaViewsById(cronicaId);

      res.status(200).json({
        message: `Cronica with id ${cronicaId} has increased views by 1`,
        cronicaUpdated,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE TOURNAMENT ----------
  deleteCronicaById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;

      const cronicaDeleted = await repository.deleteCronicaById(cronicaId);

      res.status(200).json({
        message: `Cronica with id ${cronicaId} has been properly deleted`,
        cronicaDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
