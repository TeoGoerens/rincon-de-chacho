import { Link } from "react-router-dom";
import "./ButtonsStyle.css";

const ViewResultsButton = ({ to }) => {
  return (
    <Link to={to} className="cf-action-btn cf-action-btn--results">
      Resultados
    </Link>
  );
};

export default ViewResultsButton;
