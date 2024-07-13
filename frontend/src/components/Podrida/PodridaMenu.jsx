//Import React & Hooks
import React from "react";
import { Link, useLocation } from "react-router-dom";

//Import CSS & styles
import "./PodridaMenuStyles.css";

//----------------------------------------
//COMPONENT
//----------------------------------------

const PodridaMenu = () => {
  const location = useLocation();
  let activeIndex;

  switch (location.pathname) {
    case "/podrida":
      activeIndex = 0;
      break;

    case "/podrida/games":
      activeIndex = 1;
      break;

    default:
      activeIndex = -1;
  }

  return (
    <div className="podrida-menu-container">
      <Link
        to="/podrida"
        className={activeIndex === 0 ? "podrida-menu-active-link" : ""}
      >
        Estadísticas
      </Link>
      <Link
        to="/podrida/games"
        className={activeIndex === 1 ? "podrida-menu-active-link" : ""}
      >
        Partidas
      </Link>
    </div>
  );
};

export default PodridaMenu;
