import FootballCategory from "../../dao/models/chachos/footballCategoryModel.js";
import baseRepository from "../baseRepository.js";

export default class FootballCategoryRepository extends baseRepository {
  constructor() {
    super(FootballCategory);
  }
}
