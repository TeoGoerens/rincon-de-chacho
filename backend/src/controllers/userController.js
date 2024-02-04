import UserRepository from "../repository/userRepository.js";
import userDTO from "../dao/dto/userDTO.js";

const repository = new UserRepository();

export default class UserController {
  // ---------- SIGN UP & CREATE USER ----------
  registerUser = async (req, res, next) => {
    try {
      const user = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
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
        email: req.body.email,
        password: req.body.password,
      };
      const userLoaded = await repository.loginUser(user);
      const userToDisplay = new userDTO(userLoaded);

      res.status(200).json({ message: "User is now logged in", userToDisplay });
    } catch (error) {
      next(error);
    }
  };

  // ---------- FORGET PASSWORD TOKEN GENERATOR ----------
  forgetPasswordTokenGenerator = async (req, res, next) => {
    try {
      const userEmail = req.body.email;

      const { user, resetToken } = await repository.createPasswordResetToken(
        userEmail
      );

      const mailSent = await repository.sendViaEmailResetToken(
        user,
        resetToken
      );
      res.status(200).json({
        message: `Token was properly generated and sent by email to user ${user.email}`,
        user,
        resetToken,
        mailSent,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- PASSWORD RESET ----------
  passwordReset = async (req, res, next) => {
    try {
      const resetToken = req.body.resetToken;
      const newPassword = req.body.newPassword;

      const userUpdated = await repository.passwordReset(
        resetToken,
        newPassword
      );

      res.status(200).json({
        message: `${userUpdated.email}'s password was correctly updated`,
        userUpdated,
      });
    } catch (error) {
      next(error);
    }
  };
}
