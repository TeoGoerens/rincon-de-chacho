//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import icons
import { IconEye } from "./ActionIcons";

const ViewButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="view-button">
        <IconEye />
      </span>
      <span className="tooltip-text">Ver</span>
    </Link>
  );
};

export default ViewButton;
