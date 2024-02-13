//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const ViewResultsButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="material-icons view-button">leaderboard</span>
    </Link>
  );
};

export default ViewResultsButton;
