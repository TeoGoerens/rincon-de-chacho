// src/helpers/email/sendBulkEmail.js
import transport from "../config/email/nodemailer.js";

/**
 * Envía correos en bloque, admitiendo un mismo contenido (subject + html)
 * para todos los destinatarios, o personalizándolos si lo deseas.
 *
 * @param {Object[]} recipients - Array de objetos con { name, email } o el shape que quieras.
 * @param {string} subject - Asunto del correo
 * @param {function|String} generateHTML - Puede ser un string fijo o
 *                                         una función que reciba (recipient) y retorne un string HTML.
 * @param {string} [fromEmail="chacho@elrincondechacho.com"] - Remitente
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
  fromEmail = '"Chacho" <chacho@elrincondechacho.com>',
}) {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("No hay destinatarios para enviar el correo");
  }

  // 1. Armar el array de mailOptions en base a si 'generateHTML' es string o función
  const mailOptionsList = recipients.map((recipient) => {
    const html =
      typeof generateHTML === "function"
        ? generateHTML(recipient)
        : generateHTML; // si generateHTML es un string fijo, úsalo tal cual

    return {
      from: fromEmail,
      to: recipient.email,
      subject,
      html,
    };
  });

  // 2. Enviar todos los correos en paralelo
  await Promise.all(
    mailOptionsList.map((mailOptions) => transport.sendMail(mailOptions))
  );
}
