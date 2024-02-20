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
  const activeIndex = location.pathname === "/chachos" ? 0 : 1;

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
    </div>
  );
};

export default ChachosMenu;
