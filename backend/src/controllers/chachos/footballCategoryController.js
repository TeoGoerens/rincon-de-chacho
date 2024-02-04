import FootballCategoryRepository from "../../repository/chachos/footballCategoryRepository.js";
const repository = new FootballCategoryRepository();

export default class FootballCategoryController {
  // ---------- GET FOOTBALL CATEGORY BY ID ----------
  getFootballCategoryById = async (req, res, next) => {
    try {
      const footballCategoryId = req.params.pid;
      const footballCategory = await repository.baseGetById(footballCategoryId);
      res.status(200).json({
        message: `Football Category with id ${footballCategoryId} has been properly retrieved`,
        footballCategory,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- GET ALL FOOTBALL CATEGORIES ----------
  getAllFootballCategories = async (req, res, next) => {
    try {
      const footballCategories = await repository.baseGetAll({
        sortBy: "name",
      });
      res.status(200).json({
        message: "All football categories have been properly retrieved",
        footballCategories,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- CREATE FOOTBALL CATEGORY ----------
  createFootballCategory = async (req, res, next) => {
    try {
      const footballCategory = {
        name: req.body.name,
      };

      const footballCategoryLoaded = await repository.baseCreate(
        footballCategory,
        "name"
      );

      res.status(200).json({
        message: "La categoria fue correctamente creada",
        footballCategoryLoaded,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- UPDATE FOOTBALL CATEGORY ----------
  updateFootballCategory = async (req, res, next) => {
    try {
      const footballCategoryId = req.params.pid;

      const newFootballCategoryInfo = {
        name: req.body.name,
      };

      const footballCategoryUpdated = await repository.baseUpdateById(
        footballCategoryId,
        newFootballCategoryInfo
      );
      res.status(200).json({
        message: `Football category with id ${footballCategoryId} has been properly updated`,
        footballCategoryUpdated,
      });
    } catch (error) {
      next(error);
    }
  };
  // ---------- DELETE FOOTBALL CATEGORY ----------
  deleteFootballCategoryById = async (req, res, next) => {
    try {
      const footballCategoryId = req.params.pid;
      const footballCategoryDeleted = await repository.baseDeleteById(
        footballCategoryId
      );
      res.status(200).json({
        message: `Football category with id ${footballCategoryId} has been properly deleted`,
        footballCategoryDeleted,
      });
    } catch (error) {
      next(error);
    }
  };
}
