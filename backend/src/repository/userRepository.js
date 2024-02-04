import User from "../dao/models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import baseRepository from "./baseRepository.js";
import transport from "../config/email/nodemailer.js";

export default class UserRepository extends baseRepository {
  constructor() {
    super(User);
  }
  // ---------- SIGN UP & CREATE USER ----------
  createUser = async (user) => {
    //Check if user exists
    const userExists = await User.findOne({ email: user.email });
    if (userExists) {
      throw new Error("El usuario ya está registrado en la base de datos");
    }

    //Hash user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(user.password, salt);

    //Create user
    const userToLoad = await User.create({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: hashedPassword,
    });

    return userToLoad;
  };

  // ---------- LOGIN USER ----------
  loginUser = async (user) => {
    //Check if user exists
    const userExists = await User.findOne({ email: user.email });
    if (!userExists) {
      throw new Error("Este usuario no figura en nuestra base de datos");
    }

    //Compare hashed passwords
    const matchingPasswords = await bcrypt.compareSync(
      user.password,
      userExists.password
    );

    //Return user information
    if (matchingPasswords) {
      return userExists;
    } else {
      throw new Error(
        "Las credenciales no son válidas. Verifica la información ingresada"
      );
    }
  };

  // ---------- CREATE PASSWORD RESET TOKEN ----------
  createPasswordResetToken = async (email) => {
    //Check if user exists
    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      throw new Error("User is not properly registered");
    }

    //Create reset token, hash it and append it to user in database
    try {
      const resetToken = crypto.randomBytes(32).toString("hex");
      userExists.password_reset_token = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      userExists.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000);
      userExists.save();

      const user = {
        _id: userExists._id,
        first_name: userExists.first_name,
        last_name: userExists.last_name,
        email: userExists.email,
      };

      //Return the hashed token
      return { user, resetToken };
    } catch (error) {
      throw new Error("Hashing process failed");
    }
  };

  // ---------- SEND PASSWORD RESET TOKEN VIA MAIL TO USER ----------
  sendViaEmailResetToken = async (user, token) => {
    const mailOptions = {
      from: "chacho@elrincondechacho.com",
      to: user.email,
      subject: "Chacal olvidadizo... Resetea tu contraseña",
      html: `<h1>Hola ${user.first_name} ${user.last_name}</h1>
            <h3>Sos un chacal muy distraído</h3>
            <p>Por favor hace click en el siguiente link, el cuál será válido por los próximos 10 minutos <a href="http://localhost:8080/reset-password/${token}">Resetear contraseña</a></p>`,
    };
    let mailSent = await transport.sendMail(mailOptions);

    return mailSent;
  };

  // ---------- VALIDATE TOKEN RECEIVED AND RESET PASSWORD ----------
  passwordReset = async (token, password) => {
    //Hash token and password provided
    if (!token || !password) {
      throw new Error("Missing information. Please try again");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    if (!hashedToken || !hashedPassword) {
      throw new Error("Error while hashing data. Please try again");
    }

    //Find user based on matching hashed token and within expiry interval
    const userExists = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() },
    });

    if (!userExists) {
      throw new Error("Token expired. Request your new token by email");
    }

    //In case a user was found, update password
    userExists.password = hashedPassword;
    userExists.password_reset_token = null;
    userExists.password_reset_expires = null;
    userExists.password_changed_at = Date.now();
    await userExists.save();

    return userExists;
  };
}
