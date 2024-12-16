//Import React & Hooks
import React from "react";
import { Link, useLocation } from "react-router-dom";

//Import CSS & styles
import "./AdminMenuStyles.css";

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminMenu = () => {
  const location = useLocation();

  return (
    <>
      <div className="admin-menu-container">
        <Link
          to="/admin/users"
          className={
            location.pathname.startsWith("/admin/users")
              ? "admin-menu-active-link"
              : ""
          }
        >
          Usuarios
        </Link>
        <Link
          to="/admin/prode"
          className={
            location.pathname.startsWith("/admin/prode")
              ? "admin-menu-active-link"
              : ""
          }
        >
          Prode
        </Link>
        <Link
          to="/admin/cronicas"
          className={
            location.pathname.startsWith("/admin/cronicas")
              ? "admin-menu-active-link"
              : ""
          }
        >
          Crónicas
        </Link>
        <Link
          to="/admin/chachos"
          className={
            location.pathname.startsWith("/admin/chachos")
              ? "admin-menu-active-link"
              : ""
          }
        >
          Chachos
        </Link>
      </div>
    </>
  );
};

export default AdminMenu;
