import User from "../../dao/models/userModel.js";
import baseRepository from "../../repository/baseRepository.js";

const repository = new baseRepository(User);

import dotenv from "dotenv";
dotenv.config();

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const userId = req.user;
    const userLogged = await repository.baseGetById(userId.id);
    if (userLogged.is_admin) {
      next();
    } else {
      const customError = new Error("Access denied");
      customError.status = 403;
      next(customError);
    }
  } catch (error) {
    const customError = new Error("User was not found in database");
    customError.status = 404;
    next(customError);
  }
};

export default adminAuthMiddleware;
