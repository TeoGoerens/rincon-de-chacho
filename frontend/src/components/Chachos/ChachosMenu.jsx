import React from "react";
import { Link } from "react-router-dom";

const ChachosMenu = () => {
  return (
    <>
      <Link to="/chachos">Estadisticas</Link>
      <Link to="/chachos/tournament-rounds">Fechas</Link>
    </>
  );
};

export default ChachosMenu;
