//Import React & Hooks
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

//Import Components
import AdminMenu from "../AdminMenu";

//Import CSS & styles
import "./AdminChachosPanelStyles.css";

//----------------------------------------
//CONSTANTS
//----------------------------------------

const SUB_SECTIONS = [
  { label: "Fechas", to: "tournament-rounds", icon: "fa-calendar-days" },
  { label: "Jugadores", to: "players", icon: "fa-circle-user" },
  { label: "Equipos", to: "teams", icon: "fa-people-group" },
  { label: "Categorías", to: "football-categories", icon: "fa-layer-group" },
  { label: "Torneos", to: "tournaments", icon: "fa-trophy" },
  { label: "Estadísticas", to: "match-stats", icon: "fa-chart-line" },
];

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminChachosPanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="acp">
        <aside className="acp-sidebar">
          <div className="acp-sidebar-header">
            <div className="acp-eyebrow">
              <span className="acp-eyebrow-dot" />
              Panel admin
            </div>
            <h2 className="acp-title">Chachos</h2>
          </div>

          <div className="acp-sidebar-divider" />

          <nav className="acp-nav">
            {SUB_SECTIONS.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `acp-nav-link${isActive ? " acp-nav-link--active" : ""}`
                }
              >
                <i className={`fa-solid ${section.icon} acp-nav-icon`}></i>
                <span className="acp-nav-label">{section.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="acp-content">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminChachosPanel;
