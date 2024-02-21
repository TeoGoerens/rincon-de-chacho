//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import components
import viewResultsSource from "../../../assets/images/view-results.png";

const ViewResultsButton = ({ to }) => {
  return (
    <Link to={to}>
      <img src={viewResultsSource} alt="View Results Icon" />
      <span className="tooltip-text">Ver resultados</span>
    </Link>
  );
};

export default ViewResultsButton;
