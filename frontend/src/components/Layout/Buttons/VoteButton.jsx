import { Link } from "react-router-dom";
import "./ButtonsStyle.css";

const VoteButton = () => {
  return (
    <Link to="/chachos#vote" className="cf-action-btn cf-action-btn--vote">
      Votar
    </Link>
  );
};

export default VoteButton;
