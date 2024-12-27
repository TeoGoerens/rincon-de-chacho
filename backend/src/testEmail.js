import transport from "./config/email/nodemailer.js";

const enviarCorreo = async () => {
  try {
    const info = await transport.sendMail({
      from: '"Chacho" <chacho@elrincondechacho.com>', // Debe estar verificado en SES
      to: "goerens_teo@hotmail.com", // Cambia al correo de prueba
      subject: "Correo de Prueba desde Amazon SES",
      text: "Este es un correo de prueba enviado utilizando Amazon SES vía SMTP.",
      html: "<p>Este es un <b>correo de prueba</b> enviado utilizando Amazon SES vía SMTP.</p>",
    });
    console.log("Correo enviado:", info.response);
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
};

enviarCorreo();
