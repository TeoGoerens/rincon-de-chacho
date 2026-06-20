//Import React & Hooks
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

//Import Components
import AdminMenu from "../AdminMenu";

//Import CSS & styles
import "./AdminPodridaPanelStyles.css";

//----------------------------------------
//CONSTANTS
//----------------------------------------

const SUB_SECTIONS = [
  { label: "Partidas", to: "", end: true, icon: "fa-pencil" },
  { label: "Jugadores", to: "jugadores", end: false, icon: "fa-circle-user" },
];

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminPodridaPanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="apd">
        <aside className="apd-sidebar">
          <div className="apd-sidebar-header">
            <div className="apd-eyebrow">
              <span className="apd-eyebrow-dot" />
              Panel admin
            </div>
            <h2 className="apd-title">Podrida</h2>
          </div>

          <div className="apd-sidebar-divider" />

          <nav className="apd-nav">
            {SUB_SECTIONS.map((section) => (
              <NavLink
                key={section.to || "index"}
                to={section.to}
                end={section.end}
                className={({ isActive }) =>
                  `apd-nav-link${isActive ? " apd-nav-link--active" : ""}`
                }
              >
                <i className={`fa-solid ${section.icon} apd-nav-icon`}></i>
                <span className="apd-nav-label">{section.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="apd-content">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminPodridaPanel;
