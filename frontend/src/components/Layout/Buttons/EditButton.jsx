//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const EditButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="material-icons edit-button">edit</span>
    </Link>
  );
};

export default EditButton;
