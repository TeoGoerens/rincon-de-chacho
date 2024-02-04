//Import React & Hooks
import React from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

const DeleteButton = ({ onClick, id }) => {
  return (
    <button onClick={() => onClick(id)}>
      <span class="material-icons delete-button">delete</span>
    </button>
  );
};

export default DeleteButton;
