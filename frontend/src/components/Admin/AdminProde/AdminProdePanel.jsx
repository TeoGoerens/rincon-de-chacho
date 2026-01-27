import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import AdminMenu from "../AdminMenu";

// ✅ CSS BASE PRODE (UN SOLO IMPORT GLOBAL PARA TODA LA SECCIÓN)
// Ruta correcta desde: components/Admin/AdminProde -> components/Prode/styles
import "../../Prode/styles/ProdeBaseStyles.css";

const AdminProdePanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="container">
        <div className="admin-prode-container">
          <div className="admin-prode-container-menu">
            <h3>Admin Prode</h3>

            <div className="admin-prode-container-menu-links">
              <NavLink
                to=""
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-circle-user"></i>
                <p>Jugadores</p>
              </NavLink>

              <NavLink
                to="torneos"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-trophy"></i>
                <p>Torneos</p>
              </NavLink>

              <NavLink
                to="fechas"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i className="fa-solid fa-calendar-days"></i>
                <p>Fechas</p>
              </NavLink>
            </div>
          </div>

          <div className="admin-prode-container-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProdePanel;
