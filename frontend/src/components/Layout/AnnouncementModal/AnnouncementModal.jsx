import { useState } from "react";
import "./AnnouncementModalStyle.css";

/* Ícono genérico de aviso/megáfono — no depende del contenido del anuncio */
const IconAnnouncement = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11v2a2 2 0 0 0 2 2h1l3.5 5v-5H13l6-4V7l-6-4H9.5v5H6a2 2 0 0 0-2 2Z" />
    <path d="M13 7v10" />
  </svg>
);

/* Modal de anuncio reutilizable, acotado a una ventana de fechas.
   No persiste el cierre (ni localStorage ni session): si el usuario entra de
   nuevo a la sección donde está montado, dentro de la ventana, vuelve a
   aparecer — es la visibilidad máxima que se busca en una comunicación
   puntual al grupo. Fuera de la ventana no renderiza nada. */
const AnnouncementModal = ({ startDate, endDate, title, children }) => {
  const [closed, setClosed] = useState(false);

  const now = new Date();
  const start = new Date(`${startDate}T00:00:00`);
  const end   = new Date(`${endDate}T23:59:59`);
  const isWithinWindow = now >= start && now <= end;

  if (!isWithinWindow || closed) return null;

  return (
    <div className="am-overlay">
      <div className="am-modal">
        <button
          type="button"
          className="am-close"
          onClick={() => setClosed(true)}
          aria-label="Cerrar aviso"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="am-icon"><IconAnnouncement /></div>

        <h4 className="am-title">{title}</h4>
        <div className="am-body">{children}</div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
