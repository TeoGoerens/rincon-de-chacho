//Import React & Hooks
import React, { useState } from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

const DeleteButton = ({ onClick, id }) => {
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
      <button onClick={handleOpenModal}>
        <span className="material-icons delete-button">delete</span>
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
