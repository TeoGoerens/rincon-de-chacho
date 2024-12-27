import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transport = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST, // Ahora es el host de Amazon SES y no de Hostinger
  port: process.env.NODEMAILER_PORT, // Ahora el puerto es 587 para TLS (es mas avanzado que SSL que esta obsoleto y usa el puerto 465)
  secure: process.env.NODEMAILER_PORT === "465", // true para 465, false para otros puertos
  auth: {
    user: process.env.NODEMAILER_USER, // Access key id de IAM
    pass: process.env.NODEMAILER_PASSWORD, // Contraseña generada por el script convert_to_smtp.js a partir del access key id de IAM
  },
});

export default transport;
