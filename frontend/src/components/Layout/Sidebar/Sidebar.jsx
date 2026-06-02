import { Link, useLocation } from "react-router-dom";
import "./SidebarStyle.css";
import { useSelector } from "react-redux";
import { IconUsers, IconLayers, IconBars, IconOpenBook } from "../Icons/SectionIcons";

const LINKS = [
  { to: "/home",          SvgIcon: null,         matIcon: "home",         label: "Home",     color: "var(--color-home)"     },
  { to: "/photo-gallery", SvgIcon: null,         matIcon: "photo_camera", label: "Galería",  color: "var(--color-galeria)"  },
  { to: "/chachos",       SvgIcon: IconUsers,    matIcon: null,           label: "Chachos",  color: "var(--color-chachos)"  },
  { to: "/podrida",       SvgIcon: IconLayers,   matIcon: null,           label: "Podrida",  color: "var(--color-podrida)"  },
  { to: "/prode",         SvgIcon: IconBars,     matIcon: null,           label: "Prode",    color: "var(--color-prode)"    },
  { to: "/cronicas",      SvgIcon: IconOpenBook, matIcon: null,           label: "Crónicas", color: "var(--color-cronicas)" },
];

function Sidebar({ sidebarOpen, handleToggleSidebar }) {
  const { isAdmin } = useSelector((store) => store.users);
  const { pathname } = useLocation();

  const isActive = (to) =>
    to === "/home"
      ? pathname === "/home"
      : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <div
        className={`sidebar-overlay${sidebarOpen ? " sidebar-overlay-active" : ""}`}
        onClick={handleToggleSidebar}
      />
      <aside className={`sidebar${sidebarOpen ? " sidebar-active" : ""}`}>

        <div className="sidebar-header">
          <p className="sidebar-brand">
            El Rincón de <span>Chacho</span>
          </p>
          <span
            className="material-symbols-outlined sidebar-close-btn"
            onClick={handleToggleSidebar}
          >
            close
          </span>
        </div>
        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          <ul>
            {LINKS.map(({ to, SvgIcon, matIcon, label, color }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`aside-link${isActive(to) ? " aside-link--active" : ""}`}
                  onClick={handleToggleSidebar}
                >
                  {SvgIcon
                    ? <div className="aside-link-icon aside-link-icon--svg"><SvgIcon color={color} /></div>
                    : <div className="material-symbols-outlined aside-link-icon" style={{ color }}>{matIcon}</div>
                  }
                  <div className="aside-link-label">{label}</div>
                  {isActive(to) && <div className="aside-link-dot" style={{ background: color }} />}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link
                  to="/admin/users"
                  className={`aside-link${pathname.startsWith("/admin") ? " aside-link--active" : ""}`}
                  onClick={handleToggleSidebar}
                >
                  <div className="material-symbols-outlined aside-link-icon" style={{ color: "var(--color-admin)" }}>admin_panel_settings</div>
                  <div className="aside-link-label">Admin</div>
                  {pathname.startsWith("/admin") && <div className="aside-link-dot" style={{ background: "var(--color-admin)" }} />}
                </Link>
              </li>
            )}
          </ul>
        </nav>

      </aside>
    </>
  );
}

export default Sidebar;
