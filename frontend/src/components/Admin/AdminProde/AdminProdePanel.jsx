//Import React & Hooks
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

//Import Components
import AdminMenu from "../AdminMenu";

//Import CSS & styles
import "./AdminProdePanelStyles.css";

//----------------------------------------
//CONSTANTS
//----------------------------------------

const SUB_SECTIONS = [
  { label: "Fechas", to: "fechas", end: false, icon: "fa-calendar-days" },
  { label: "Torneos", to: "torneos", end: false, icon: "fa-trophy" },
  { label: "Jugadores", to: "jugadores", end: false, icon: "fa-circle-user" },
];

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminProdePanel = () => {
  return (
    <>
      <AdminMenu />

      <div className="apr">
        <aside className="apr-sidebar">
          <div className="apr-sidebar-header">
            <div className="apr-eyebrow">
              <span className="apr-eyebrow-dot" />
              Panel admin
            </div>
            <h2 className="apr-title">Prode</h2>
          </div>

          <div className="apr-sidebar-divider" />

          <nav className="apr-nav">
            {SUB_SECTIONS.map((section) => (
              <NavLink
                key={section.to || "index"}
                to={section.to}
                end={section.end}
                className={({ isActive }) =>
                  `apr-nav-link${isActive ? " apr-nav-link--active" : ""}`
                }
              >
                <i className={`fa-solid ${section.icon} apr-nav-icon`}></i>
                <span className="apr-nav-label">{section.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="apr-content">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AdminProdePanel;
