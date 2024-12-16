// Import React dependencies
import React from "react";
import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";

// Import Components
import AdminMenu from "../AdminMenu";

// Imports CSS & helpers
import "./AdminCronicasPanelStyles.css";

const AdminCronicasPanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="container">
        <div className="admin-cronicas-container">
          <div className="admin-cronicas-container-menu">
            <h3>Admin Crónicas</h3>
            <div className="admin-cronicas-container-menu-links">
              <NavLink
                to=""
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-regular fa-newspaper"></i>
                <p>Crónicas</p>
              </NavLink>
              <NavLink
                to="premios"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-solid fa-trophy"></i>
                <p>Premios</p>
              </NavLink>
              <NavLink
                to="solicitada"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-solid fa-pencil"></i>
                <p>Solicitadas</p>
              </NavLink>
              <NavLink
                to="pizarra"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <i class="fa-regular fa-clipboard"></i>
                <p>Pizarra</p>
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

export default AdminCronicasPanel;
