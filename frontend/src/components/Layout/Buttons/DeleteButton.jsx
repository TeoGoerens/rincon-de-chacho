//Import React & Hooks
import React, { useState } from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

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
        <i class="fa-solid fa-trash"></i>
        <span className="tooltip-text">Eliminar</span>
      </button>

      {confirmationOpen && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <h4>¿Estás seguro de que querés eliminar este elemento?</h4>
            <p>
              Asegurate de que aquello que estás borrando no esté asociado a
              otros elementos en la base de datos
            </p>
            <div className="delete-confirmation-btn-container">
              <button onClick={handleConfirmDelete}>Si</button>
              <button onClick={handleCancelDelete}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteButton;
