//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import icons
import { IconEdit } from "./ActionIcons";

const EditButton = ({ to, customCSSClass }) => {
  return (
    <Link to={to} className={customCSSClass}>
      <span className="edit-button">
        <IconEdit />
      </span>
      <span className="tooltip-text">Editar</span>
    </Link>
  );
};

export default EditButton;
