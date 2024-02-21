//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ButtonsStyle.css";

//Import components
import submitVoteSource from "../../../assets/images/submit-vote.png";

const VoteButton = ({ to }) => {
  return (
    <Link to={to}>
      <img src={submitVoteSource} alt="Submit Vote Icon" />
      <span className="tooltip-text">Votar</span>
    </Link>
  );
};

export default VoteButton;
