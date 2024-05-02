import React from "react";
import { Link } from "react-router-dom";
import AdminMenu from "../AdminMenu";

const AdminChachosPanel = () => {
  return (
    <>
      <AdminMenu />
      <div>
        <Link to="/admin/chachos/players">Jugadores</Link>
        <Link to="/admin/chachos/teams">Equipos</Link>
        <Link to="/admin/chachos/football-categories">Categorias</Link>
        <Link to="/admin/chachos/tournaments">Torneos</Link>
        <Link to="/admin/chachos/tournament-rounds">Fechas</Link>
        <Link to="/admin/chachos/interviews">Entrevistas</Link>
      </div>
    </>
  );
};

export default AdminChachosPanel;
