//Import React & Hooks
import React, { useState } from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import helpers
import { isSuperAdmin } from "../../../reactquery/getUserInformation";

/* Calavera: el ícono de la SUPER eliminación — visualmente inconfundible
   con el tacho del eliminar clásico */
const IconSkull = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a8 8 0 0 0-8 8c0 2.5 1.2 4.7 3 6.1V19a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.9c1.8-1.4 3-3.6 3-6.1a8 8 0 0 0-8-8Z" />
    <circle cx="9" cy="11" r="1.4" />
    <circle cx="15" cy="11" r="1.4" />
    <path d="M10.5 17.5V19" />
    <path d="M13.5 17.5V19" />
  </svg>
);

/* Botón de SUPER ELIMINACIÓN: borra aunque el elemento tenga datos
   asociados (el eliminar clásico lo bloquea). Solo lo ve el super admin —
   este chequeo únicamente oculta el botón; el que vale es el del backend
   (superAdminMiddleware). `warning` describe QUÉ arrastra la cascada. */
const SuperDeleteButton = ({ onClick, id, warning, customCSSClass }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  if (!isSuperAdmin()) return null;

  const handleConfirmDelete = () => {
    onClick(id);
    setConfirmationOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setConfirmationOpen(true)}
        className={customCSSClass}
      >
        <span className="super-delete-button">
          <IconSkull />
        </span>
        <span className="tooltip-text">Super eliminar</span>
      </button>

      {confirmationOpen && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--super">
              <IconSkull />
            </div>
            <h4>¿Super eliminar este elemento?</h4>
            <p>
              {warning ??
                "Se va a borrar junto con todos sus datos asociados."}
            </p>
            <p className="delete-confirmation-super-note">
              Saltea los bloqueos del eliminar clásico. Esta acción no se
              puede deshacer.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmationOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm delete-confirmation-btn-confirm--danger"
                onClick={handleConfirmDelete}
              >
                Super eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperDeleteButton;
