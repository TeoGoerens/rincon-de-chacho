//Import React & Hooks

import { Link } from "react-router-dom";

//Import components

//Import CSS & styles
import "./SidebarStyle.css";

//Import Redux
import { useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

function Sidebar({ sidebarOpen, handleToggleSidebar }) {
  //Select state from tournament rounds store
  const storeData = useSelector((store) => store.users);
  const { isAdmin } = storeData;

  return (
    <aside className={`sidebar ${sidebarOpen ? "sidebar-active" : ""}`}>
      <div className="sidebar-title">
        <p className="sidebar-logo-text">
          El rincon de <span>Chacho</span>
        </p>
        <span
          className="material-symbols-outlined sidebar-close-btn"
          onClick={handleToggleSidebar}
        >
          close
        </span>
      </div>
      <div className="sidebar-links">
        <ul>
          <li>
            <Link
              to="/home"
              className="aside-link"
              onClick={handleToggleSidebar}
            >
              <span className="material-symbols-outlined">home</span>
              <p>Home</p>
            </Link>
          </li>
          <li>
            <Link
              to="/photo-gallery"
              className="aside-link"
              onClick={handleToggleSidebar}
            >
              <span className="material-symbols-outlined">photo_camera</span>
              <p>Galería</p>
            </Link>
          </li>
          <li>
            <Link
              to="/prode"
              className="aside-link"
              onClick={handleToggleSidebar}
            >
              <span className="material-symbols-outlined">
                stadia_controller
              </span>
              <p>Prode</p>
            </Link>
          </li>
          <li>
            <Link
              to="/cronicas"
              className="aside-link"
              onClick={handleToggleSidebar}
            >
              <span className="material-symbols-outlined">edit_note</span>
              <p>Cronicas</p>
            </Link>
          </li>
          <li>
            <Link
              to="/chachos"
              className="aside-link"
              onClick={handleToggleSidebar}
            >
              <span className="material-symbols-outlined">sports_soccer</span>
              <p>Chachos</p>
            </Link>
          </li>
          {isAdmin ? (
            <li>
              <Link
                to="/admin"
                className="aside-link"
                onClick={handleToggleSidebar}
              >
                <span className="material-symbols-outlined">
                  admin_panel_settings
                </span>
                <p>Admin</p>
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
