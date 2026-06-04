import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Sidebar from "../Sidebar/Sidebar";
import UserMenu from "../UserMenu/UserMenu";
import "./NavbarStyle.css";

/* ── Monograma "C" ── */
const LogoMark = () => (
  <div className="nav-logomark">
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="nav-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#a8dadc" />
          <stop offset="100%" stopColor="#457b9d" />
        </linearGradient>
      </defs>
      <text
        x="18" y="27"
        textAnchor="middle"
        fontFamily="'Protest Strike', sans-serif"
        fontSize="26"
        fill="url(#nav-c-grad)"
      >C</text>
    </svg>
  </div>
);

/* ── Chevron ── */
const IconChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

/* ── Nombre de sección activa ── */
const SECTION_NAMES = {
  "/home":          null,
  "/photo-gallery": "Galería",
  "/chachos":       "Chachos",
  "/podrida":       "Podrida",
  "/prode":         "Prode",
  "/cronicas":      "Crónicas",
};

const useActiveSectionName = () => {
  const { pathname } = useLocation();
  if (pathname === "/home") return null;
  const match = Object.entries(SECTION_NAMES).find(([path]) =>
    path !== "/home" && (pathname === path || pathname.startsWith(path + "/"))
  );
  return match ? match[1] : null;
};

/* ── Componente ── */
const Navbar = () => {
  const storeData  = useSelector((store) => store.users);
  const { userAuth } = storeData;

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleToggleSidebar  = () => setSidebarOpen(o => !o);
  const handleToggleUserMenu = () => setUserMenuOpen(o => !o);

  const sectionName = useActiveSectionName();
  const firstName      = userAuth?.userToDisplay?.first_name      ?? userAuth?.first_name      ?? "";
  const profilePicture = userAuth?.userToDisplay?.profile_picture ?? userAuth?.profile_picture ?? "";
  const initial        = firstName.charAt(0).toUpperCase();
  const hasPhoto       = profilePicture && !profilePicture.includes("pixabay.com");

  return (
    <>
      <nav className="navbar">
        {/* Izquierda: hamburguesa + monograma + texto + breadcrumb */}
        <div className="logo-container">
          {userAuth && (
            <span className="material-symbols-outlined menu-btn" onClick={handleToggleSidebar}>
              menu
            </span>
          )}
          <Link to="/home" className="logo-link">
            <LogoMark />
            <p className="logo-text">
              El Rincón de <span>Chacho</span>
            </p>
          </Link>
          {sectionName && (
            <>
              <div className="nav-breadcrumb-sep" aria-hidden="true" />
              <span className="nav-breadcrumb-section">{sectionName}</span>
            </>
          )}
        </div>

        {/* Derecha: usuario o login */}
        <div className="menu-container">
          {userAuth ? (
            <div className="user-credentials-container" onClick={handleToggleUserMenu}>
              <div className="nav-user-avatar">
                {hasPhoto
                  ? <img className="nav-user-avatar-img" src={profilePicture} alt={firstName} />
                  : initial
                }
              </div>
              <span className="nav-user-name">{firstName}</span>
              <div className="nav-user-chevron"><IconChevron /></div>
            </div>
          ) : (
            <div className="credentials-btn-container">
              <Link to="/" className="nav-login-btn">Login</Link>
              <Link to="/register" className="nav-register-btn">Registrate</Link>
            </div>
          )}
        </div>
      </nav>

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleToggleSidebar={handleToggleSidebar}
      />
      <UserMenu
        userMenuOpen={userMenuOpen}
        handleToggleUserMenu={handleToggleUserMenu}
      />
    </>
  );
};

export default Navbar;
