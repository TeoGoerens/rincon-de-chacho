/* Plantilla unificada de los mails del Prode — mismo diseño que los mails de
   Chachos y reset de contraseña: tablas anidadas email-safe (Outlook no
   soporta flexbox/grid), colores hardcodeados en hex (las CSS variables de
   App.css no existen en el contexto de un cliente de mail), bgcolor como
   fallback de gradientes y entidades HTML en vez de UTF-8 crudo.
   La comparten los mails de apertura, recordatorio y resultados. */

const EMAIL_TZ = "America/Argentina/Buenos_Aires";

const EMAIL_WEEKDAYS = {
  Sun: "domingo",
  Mon: "lunes",
  Tue: "martes",
  Wed: "mi&eacute;rcoles",
  Thu: "jueves",
  Fri: "viernes",
  Sat: "s&aacute;bado",
};

/* Deadline legible en hora argentina: "s&aacute;bado 12/07 a las 14:00 hs"
   (el servidor puede correr en UTC, por eso el timeZone explícito) */
export const formatDeadlineForEmail = (date) => {
  const weekdayEn = new Intl.DateTimeFormat("en-US", {
    timeZone: EMAIL_TZ,
    weekday: "short",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("es-AR", {
    timeZone: EMAIL_TZ,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-AR", {
    timeZone: EMAIL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${EMAIL_WEEKDAYS[weekdayEn]} ${dayMonth} a las ${time} hs`;
};

export const buildProdeEmailHTML = ({
  iconHtml,
  title,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}) => `
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
                      <span style="font-family:'Poppins',Arial,sans-serif; font-size:15px; font-weight:600; color:#e8e8e8; letter-spacing:0.02em;">El Rinc&oacute;n de <span style="color:#a8dadc;">Chacho</span></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Icon badge -->
            <tr>
              <td align="center" style="padding:32px 28px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="52" height="52" align="center" valign="middle" bgcolor="#152a30" style="background-color:#152a30; border:1px solid rgba(168,218,220,0.3); border-radius:14px;">
                      <span style="font-family:Arial,sans-serif; font-size:22px; line-height:22px; color:#a8dadc;">${iconHtml}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td align="center" style="padding:18px 28px 6px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:12px; letter-spacing:0.18em; color:#98a8b8; text-transform:uppercase;">Prode</p>
                <h1 style="margin:0 0 14px; font-family:'Poppins',Arial,sans-serif; font-size:23px; font-weight:700; color:#e8e8e8;">${title}</h1>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:15px; line-height:1.65; color:#c0cdd8; max-width:360px;">
                  ${bodyHtml}
                </p>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td align="center" style="padding:26px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:8px;">
                      <a href="${ctaUrl}" style="display:inline-block; padding:13px 36px; font-family:'Poppins',Arial,sans-serif; font-size:14px; font-weight:600; color:#0a0a0a; text-decoration:none; letter-spacing:0.02em;">${ctaLabel}</a>
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
                  Recib&iacute;s este mail porque particip&aacute;s del Prode en elrincondechacho.com
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
