// Import React dependencies
import React from "react";
import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";

// Import Components
import AdminMenu from "../AdminMenu";

// Imports CSS & helpers
import "./AdminPodridaPanelStyles.css";

const AdminPodridaPanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="container">
        <div className="admin-cronicas-container">
          <div className="admin-cronicas-container-menu">
            <h3>Admin Podrida</h3>
            <div className="admin-cronicas-container-menu-links">
              <NavLink
                to=""
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-solid fa-pencil"></i>
                <p>Partidas</p>
              </NavLink>
              <NavLink
                to="jugadores"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-solid fa-circle-user"></i>
                <p>Jugadores</p>
              </NavLink>
            </div>
          </div>

          <div className="admin-cronicas-container-content">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPodridaPanel;
