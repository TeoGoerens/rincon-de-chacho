import UserRepository from "../repository/userRepository.js";
import userDTO from "../dao/dto/userDTO.js";

const repository = new UserRepository();

export default class UserController {
  // ---------- SIGN UP & CREATE USER ----------
  registerUser = async (req, res, next) => {
    try {
      const user = {
        first_name: "Teo",
        last_name: "Goerens",
        email: "goerens_teo@hotmail.com",
        password: "123",
      };
      const userLoaded = await repository.createUser(user);

      res
        .status(200)
        .json({ message: "User has been properly created", userLoaded });
    } catch (error) {
      next(error);
    }
  };

  // ---------- LOGIN USER ----------
  loginUser = async (req, res, next) => {
    try {
      const user = {
        first_name: "Teo",
        last_name: "Goerens",
        email: "goerens_teo@hotmail.com",
        password: "123",
      };
      const userLoaded = await repository.loginUser(user);
      const userToDisplay = new userDTO(userLoaded);

      res.status(200).json({ message: "User is now logged in", userToDisplay });
    } catch (error) {
      next(error);
    }
  };
}
