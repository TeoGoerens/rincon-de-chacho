import CronicaRepository from "../../repository/cronica/cronicaRepository.js";
const repository = new CronicaRepository();

export default class CronicaController {
  // ---------- GET CRONICA BY ID ----------
  getCronicaById = async (req, res, next) => {
    try {
      const cronicaId = req.params.id;
      const cronica = await repository.baseGetById(cronicaId);

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
      const cronicas = await repository.baseGetAll({
        sortBy: "publishedDate",
        sortOrder: "desc",
      });

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
      //Informacion de la cronica cargada en el body y en req.files
      const { title, subtitle, year, body } = req.body;
      const heroImage = req.files.heroImage?.[0]?.location || "";
      const images = (req.files.images || []).map((file) => ({
        url: file.location,
        caption: req.body[`imageCaption_${file.originalname}`] || "",
      }));
      const audios = (req.files.audios || []).map((file) => ({
        url: file.location,
        caption: req.body[`audioCaption_${file.originalname}`] || "",
      }));
      const videos = (req.files.videos || []).map((file) => ({
        url: file.location,
        caption: req.body[`videoCaption_${file.originalname}`] || "",
      }));

      const newCronica = {
        title,
        subtitle,
        year,
        body,
        heroImage,
        images,
        audios,
        videos,
      };

      const cronicaLoaded = await repository.baseCreate(newCronica, "title");

      res.status(200).json({
        message: "Cronica has been properly created",
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
        message: `Cronica with id ${cronicaId} has been updated`,
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
      const cronicaDeleted = await repository.baseDeleteById(cronicaId);
      res.status(200).json({
        message: `Cronica with id ${cronicaId} has been properly deleted`,
        cronicaDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}