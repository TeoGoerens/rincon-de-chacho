//Import React & Hooks
import React from "react";
import { Link, useLocation } from "react-router-dom";

//Import CSS & styles
import "./ChachosMenuStyles.css";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosMenu = () => {
  const location = useLocation();
  let activeIndex;

  switch (location.pathname) {
    case "/chachos":
      activeIndex = 0;
      break;

    case "/chachos/tournament-rounds":
      activeIndex = 1;
      break;

    case "/chachos/squad":
      activeIndex = 2;
      break;

    default:
      activeIndex = -1;
  }

  return (
    <div className="chachos-menu-container">
      <Link
        to="/chachos"
        className={activeIndex === 0 ? "chachos-menu-active-link" : ""}
      >
        Estadisticas
      </Link>
      <Link
        to="/chachos/tournament-rounds"
        className={activeIndex === 1 ? "chachos-menu-active-link" : ""}
      >
        Fechas
      </Link>
      <Link
        to="/chachos/squad"
        className={activeIndex === 2 ? "chachos-menu-active-link" : ""}
      >
        Nosotros
      </Link>
    </div>
  );
};

export default ChachosMenu;
