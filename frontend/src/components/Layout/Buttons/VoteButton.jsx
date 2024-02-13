//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

const VoteButton = ({ to }) => {
  return (
    <Link to={to}>
      <span className="material-icons view-button">how_to_vote</span>
    </Link>
  );
};

export default VoteButton;
