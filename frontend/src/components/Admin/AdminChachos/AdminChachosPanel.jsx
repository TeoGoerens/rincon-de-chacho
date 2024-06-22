//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";

//Import Components
import AdminMenu from "../AdminMenu";

//Import CSS & styles
import "./AdminChachosPanelStyles.css";

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminChachosPanel = () => {
  return (
    <>
      <AdminMenu />
      <div className="container admin-chachos-panel-container">
        <Link
          className="admin-chachos-panel-option"
          to="/admin/chachos/players"
        >
          Jugadores
        </Link>
        <Link className="admin-chachos-panel-option" to="/admin/chachos/teams">
          Equipos
        </Link>
        <Link
          className="admin-chachos-panel-option"
          to="/admin/chachos/football-categories"
        >
          Categorias
        </Link>
        <Link
          className="admin-chachos-panel-option"
          to="/admin/chachos/tournaments"
        >
          Torneos
        </Link>
        <Link
          className="admin-chachos-panel-option"
          to="/admin/chachos/tournament-rounds"
        >
          Fechas
        </Link>
        <Link
          className="admin-chachos-panel-option"
          to="/admin/chachos/interviews"
        >
          Entrevistas
        </Link>
      </div>
    </>
  );
};

export default AdminChachosPanel;
