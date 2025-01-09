// src/helpers/email/sendBulkEmail.js
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";
dotenv.config();

// Crear el cliente de SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Envía correos en bloque, admitiendo un mismo contenido (subject + html)
 * para todos los destinatarios, o personalizándolos si lo deseas.
 *
 * @param {Object[]} recipients - Array de objetos con { name, email } o el shape que quieras.
 * @param {string} subject - Asunto del correo
 * @param {function|String} generateHTML - Puede ser un string fijo o
 *                                         una función que reciba (recipient) y retorne un string HTML.
 * @param {string} [fromEmail=process.env.EMAIL_SOURCE] - Remitente verificado
 *
 * @example
 *  await sendBulkEmail({
 *    recipients: [
 *      { name: "Juan", email: "juan@example.com" },
 *      { name: "Ana",  email: "ana@example.com" },
 *    ],
 *    subject: "Nueva crónica publicada",
 *    generateHTML: (recipient) => `
 *       <h1>Hola ${recipient.name}!</h1>
 *       <p>Se acaba de publicar una nueva crónica...</p>
 *     `
 *  });
 */
export async function sendBulkEmail({
  recipients,
  subject,
  generateHTML,
  fromEmail = process.env.EMAIL_SOURCE,
}) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No hay destinatarios para enviar el correo");
  }

  // Verificar que el remitente esté configurado
  if (!fromEmail) {
    throw new Error(
      "El remitente no está configurado. Verifica la variable de entorno EMAIL_SOURCE."
    );
  }

  // Iterar sobre los destinatarios y enviar correos individualmente
  const promises = recipients.map(async (recipient) => {
    const html =
      typeof generateHTML === "function"
        ? generateHTML(recipient)
        : generateHTML; // si generateHTML es un string fijo, úsalo tal cual

    const params = {
      Source: fromEmail,
      Destination: {
        ToAddresses: [recipient.email],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: html }, // Contenido HTML
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await sesClient.send(command);
    } catch (error) {
      throw error; // Puedes decidir si seguir o detenerte ante un error
    }
  });

  // Esperar a que se resuelvan todas las promesas
  await Promise.all(promises);
}
