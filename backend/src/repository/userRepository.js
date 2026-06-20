import User from "../dao/models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3/s3Client.js";
import baseRepository from "./baseRepository.js";
import { sendBulkEmail } from "../helpers/sendBulkEmail.js";

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
    const subject = "Resetear contraseña";
    const generateHTML = (recipient) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#0d0d0d; border-radius:16px; overflow:hidden; border:1px solid rgba(168,218,220,0.12);">
            <!-- Top accent bar -->
            <tr>
              <td height="3" bgcolor="#a8dadc" style="background:linear-gradient(to right,#457b9d,#a8dadc,#457b9d); font-size:1px; line-height:1px;">&nbsp;</td>
            </tr>
            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 24px 22px; border-bottom:1px solid rgba(255,255,255,0.07);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="34" height="34" align="center" valign="middle" bgcolor="#457b9d" style="background-color:#457b9d; border-radius:9px; font-family:'Poppins',Arial,sans-serif; font-weight:bold; color:#0a0a0a; font-size:16px;">C</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <span style="font-family:'Poppins',Arial,sans-serif; font-size:15px; font-weight:600; color:#e8e8e8; letter-spacing:0.02em;">El Rincón de <span style="color:#a8dadc;">Chacho</span></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Icon badge (padlock) -->
            <tr>
              <td align="center" style="padding:32px 28px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="52" height="52" align="center" valign="middle" bgcolor="#152a30" style="background-color:#152a30; border:1px solid rgba(168,218,220,0.3); border-radius:14px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" height="11" style="font-size:1px; line-height:1px;">
                            <div style="width:14px; height:10px; border:2px solid #a8dadc; border-bottom:none; border-radius:7px 7px 0 0;">&nbsp;</div>
                          </td>
                        </tr>
                        <tr>
                          <td width="22" height="15" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:3px;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td align="center" style="padding:18px 28px 6px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:12px; letter-spacing:0.18em; color:#98a8b8; text-transform:uppercase;">Cuenta</p>
                <h1 style="margin:0 0 14px; font-family:'Poppins',Arial,sans-serif; font-size:23px; font-weight:700; color:#e8e8e8;">Resetear contraseña</h1>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:15px; line-height:1.65; color:#c0cdd8; max-width:360px;">
                  Hola ${recipient.first_name} ${recipient.last_name}, recibimos una solicitud para resetear tu contraseña. El siguiente link es válido por los próximos 10 minutos.
                </p>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td align="center" style="padding:26px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:8px;">
                      <a href="https://elrincondechacho.com/reset-password/${token}" style="display:inline-block; padding:13px 36px; font-family:'Poppins',Arial,sans-serif; font-size:14px; font-weight:600; color:#0a0a0a; text-decoration:none; letter-spacing:0.02em;">Resetear contraseña</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:28px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td height="1" style="background:linear-gradient(to right, transparent, rgba(168,218,220,0.35), transparent); font-size:1px; line-height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 28px 28px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:10px; letter-spacing:0.25em; color:#5d7a87; text-transform:uppercase;">amigos &middot; f&uacute;tbol &middot; apuestas &middot; memoria</p>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:11px; color:#4a5a6a;">
                  Si no solicitaste este cambio, podés ignorar este mail.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    await sendBulkEmail({ recipients: [user], subject, generateHTML });
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
