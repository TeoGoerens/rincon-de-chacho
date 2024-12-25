import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dotenv from "dotenv";

dotenv.config();

console.log(process.env.AWS_REGION);
console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);

// Configura el cliente SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Envía un correo de prueba
const sendEmail = async () => {
  const params = {
    Source: "chacho@elrincondechacho.com", // Cambia al correo verificado
    Destination: {
      ToAddresses: ["goerens_teo@hotmail.com"], // Cambia al correo de prueba
    },
    Message: {
      Subject: { Data: "Correo de prueba desde SES" },
      Body: {
        Text: { Data: "Este es un correo de prueba enviado desde Amazon SES." },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log("Correo enviado exitosamente:", response);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};

sendEmail();
