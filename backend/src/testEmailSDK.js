// src/testEmailSDK.js
import { sendBulkEmail } from "./helpers/sendBulkEmail.js";

(async () => {
  try {
    await sendBulkEmail({
      recipients: [
        { name: "Teo", email: "goerens_teo@hotmail.com" },
        { name: "Teito", email: "teogoerens@gmail.com" },
      ],
      subject: "Prueba de Amazon SES con SDK",
      generateHTML: (recipient) => `
        <h1>Hola ${recipient.name}!</h1>
        <p>Este es un correo de prueba enviado utilizando Amazon SES y el SDK.</p>
      `,
    });
    console.log("Correos enviados exitosamente.");
  } catch (error) {
    console.error("Error al enviar correos:", error);
  }
})();
