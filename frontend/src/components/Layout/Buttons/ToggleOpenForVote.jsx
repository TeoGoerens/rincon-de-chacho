//Import React & Hooks
import React, { useState } from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

const ToggleOpenForVote = ({ isOpen, onClick, id }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const handleOpenModal = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmToggle = () => {
    onClick(id);
    setConfirmationOpen(false);
  };

  const handleCancelToggle = () => {
    setConfirmationOpen(false);
  };

  const buttonClassName = isOpen ? "close-vote" : "open-vote";
  return (
    <>
      <button className={buttonClassName} onClick={handleOpenModal}>
        {isOpen ? "Close" : "Open"}
      </button>

      {confirmationOpen && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <h4>¿Estás seguro de que querés cambiar el estado de la fecha?</h4>
            <p>Se informará a todos los usuarios registrados vía mail</p>
            <div className="delete-confirmation-btn-container">
              <button onClick={handleConfirmToggle}>Si</button>
              <button onClick={handleCancelToggle}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToggleOpenForVote;
