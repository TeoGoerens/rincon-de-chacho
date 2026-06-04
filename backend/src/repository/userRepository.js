import User from "../dao/models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3/s3Client.js";
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
      const userExistsUpdatedLogin = await User.findOneAndUpdate(
        { email: user.email },
        { $set: { last_login: new Date() } },
        { new: true }
      );
      return userExistsUpdatedLogin;
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
      throw new Error(
        "El usuario no está correctamente registrado en la base de datos"
      );
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
      html: `    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">

      <h1>Hola ${user.first_name} ${user.last_name}</h1>
      <h3>Sos un chacal muy distraído</h3>
      <p>
        Por favor hace click en el siguiente link, el cuál será válido por los próximos 10 minutos
        <a href="https://elrincondechacho.com/reset-password/${token}">Resetear contraseña</a>
      </p>
    </div>`,
    };
    let mailSent = await transport.sendMail(mailOptions);

    return mailSent;
  };

  // ---------- UPDATE PROFILE PICTURE ----------
  updateProfilePicture = async (userId, fileBuffer, mimetype) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    // Eliminar foto anterior de S3 si existe
    if (user.profile_picture_key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: user.profile_picture_key,
        })
      );
    }

    // Procesar imagen con Sharp: recortar a 400x400 y convertir a WebP
    const processedBuffer = await sharp(fileBuffer)
      .resize(512, 512, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer();

    // Construir key con carpeta según entorno
    const env = process.env.NODE_ENV === "production" ? "production" : "development";
    const key = `users/${env}/${userId}_${Date.now()}.webp`;

    // Subir a S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: processedBuffer,
        ContentType: "image/webp",
      })
    );

    // Construir URL pública
    const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Actualizar usuario
    user.profile_picture = url;
    user.profile_picture_key = key;
    await user.save();

    return await User.findById(userId).select(
      "-password -password_reset_token -password_reset_expires -password_changed_at"
    );
  };

  // ---------- GET ALL USERS (ADMIN) ----------
  getAllUsers = async () => {
    return await User.find()
      .select("-password -password_reset_token -password_reset_expires -password_changed_at")
      .populate("chacho_player", "first_name last_name shirt")
      .populate("podrida_player", "name")
      .populate("prode_player", "name")
      .sort({ last_name: 1 });
  };

  // ---------- UPDATE USER (ADMIN) ----------
  updateUser = async (userId, data) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const allowed = ["first_name", "last_name", "role", "is_admin", "chacho_player", "podrida_player", "prode_player"];
    allowed.forEach((field) => {
      if (data[field] !== undefined) user[field] = data[field];
    });

    await user.save();
    return await User.findById(userId)
      .select("-password -password_reset_token -password_reset_expires -password_changed_at")
      .populate("chacho_player", "first_name last_name shirt")
      .populate("podrida_player", "name")
      .populate("prode_player", "name");
  };

  // ---------- VALIDATE TOKEN RECEIVED AND RESET PASSWORD ----------
  passwordReset = async (token, password) => {
    //Hash token and password provided
    if (!token || !password) {
      throw new Error("Hay información faltante. Por favor volvé a intentarlo");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    if (!hashedToken || !hashedPassword) {
      throw new Error(
        "Hubo un error validando el token. Por favor volvé a intentarlo"
      );
    }

    //Find user based on matching hashed token and within expiry interval
    const userExists = await User.findOne({
      password_reset_token: hashedToken,
      password_reset_expires: { $gt: Date.now() },
    });

    if (!userExists) {
      throw new Error("Tu token expiró, volvé a solicitarlo por correo");
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
