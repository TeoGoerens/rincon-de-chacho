//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import components

const CreateStatsButton = ({ to }) => {
  return (
    <Link to={to}>
      <span class="material-icons create-stat-button">add_circle</span>
      <span className="tooltip-text">Crear estadística</span>
    </Link>
  );
};

export default CreateStatsButton;
