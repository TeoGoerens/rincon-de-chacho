//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import icons
import { IconPlusCircle } from "./ActionIcons";

const CreateStatsButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="create-stat-button">
        <IconPlusCircle />
      </span>
      <span className="tooltip-text">Crear estadística</span>
    </Link>
  );
};

export default CreateStatsButton;
