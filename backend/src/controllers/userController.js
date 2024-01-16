import UserRepository from "../repository/userRepository.js";
const repository = new UserRepository();

export default class UserController {
  // ---------- SIGN UP & CREATE USER ----------
  signup = async (req, res, next) => {
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
}
