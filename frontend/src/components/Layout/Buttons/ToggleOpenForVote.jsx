//Import React & Hooks
import React from "react";

//Import CSS & styles
import "./ButtonsStyle.css";

const ToggleOpenForVote = ({ isOpen, onClick, id }) => {
  const buttonClassName = isOpen ? "close-vote" : "open-vote";
  return (
    <button className={buttonClassName} onClick={() => onClick(id)}>
      {isOpen ? "Close" : "Open"}
    </button>
  );
};

export default ToggleOpenForVote;
