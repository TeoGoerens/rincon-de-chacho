//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const EditButton = ({ to, customCSSClass }) => {
  return (
    <Link to={to} className={customCSSClass}>
      <i class="fa-solid fa-pen-to-square"></i>
      <span className="tooltip-text">Editar</span>
    </Link>
  );
};

export default EditButton;
