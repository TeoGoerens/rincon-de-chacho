//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const ViewButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="material-icons view-button">visibility</span>
      <span className="tooltip-text">Ver</span>
    </Link>
  );
};

export default ViewButton;
