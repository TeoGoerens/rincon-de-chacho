//Import React & Hooks
import React, { useState } from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import icons
import { IconTrash } from "./ActionIcons";

const DeleteButton = ({ onClick, id, customCSSClass }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const handleOpenModal = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    onClick(id);
    setConfirmationOpen(false);
  };

  const handleCancelDelete = () => {
    setConfirmationOpen(false);
  };

  return (
    <>
      <button onClick={handleOpenModal} className={customCSSClass}>
        <span className="delete-button">
          <IconTrash />
        </span>
        <span className="tooltip-text">Eliminar</span>
      </button>

      {confirmationOpen && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon">
              <IconTrash />
            </div>
            <h4>¿Eliminar este elemento?</h4>
            <p>
              Asegurate de que no esté asociado a otros elementos en la base
              de datos. Esta acción no se puede deshacer.
            </p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm delete-confirmation-btn-confirm--danger"
                onClick={handleConfirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteButton;
