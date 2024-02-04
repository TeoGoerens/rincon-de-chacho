//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const ViewButton = ({ to }) => {
  return (
    <Link to={to}>
      <span class="material-icons view-button">visibility</span>
    </Link>
  );
};

export default ViewButton;
