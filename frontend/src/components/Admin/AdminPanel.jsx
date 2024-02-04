import React from "react";
import { Link } from "react-router-dom";

const AdminPanel = () => {
  return (
    <>
      <Link to="/admin/chachos/players">Jugadores</Link>
      <Link to="/admin/chachos/teams">Equipos</Link>
      <Link to="/admin/chachos/football-categories">Categorias</Link>
      <Link to="/admin/chachos/tournaments">Torneos</Link>
      <Link to="/admin/chachos/tournament-rounds">Fechas</Link>
      <Link to="/admin/chachos/statistics">Estadisticas</Link>
    </>
  );
};

export default AdminPanel;
