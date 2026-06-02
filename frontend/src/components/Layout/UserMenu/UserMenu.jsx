import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "../../../redux/slices/users/usersSlices";
import "./UserMenuStyle.css";

function UserMenu({ userMenuOpen, handleToggleUserMenu }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userAuth } = useSelector((store) => store.users);

  const firstName = userAuth?.userToDisplay?.first_name ?? userAuth?.first_name ?? "";
  const lastName  = userAuth?.userToDisplay?.last_name  ?? userAuth?.last_name  ?? "";
  const email     = userAuth?.userToDisplay?.email      ?? userAuth?.email      ?? "";
  const initial   = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    dispatch(logoutUserAction());
    handleToggleUserMenu();
    navigate("/");
  };

  return (
    <>
      {/* Overlay — click fuera cierra el menú */}
      <div
        className={`um-overlay${userMenuOpen ? " um-overlay-active" : ""}`}
        onClick={handleToggleUserMenu}
      />

      {/* Panel */}
      <div className={`um${userMenuOpen ? " um-open" : ""}`}>

        {/* ── Header: avatar + nombre + email + cerrar ── */}
        <div className="um-header">
          <div className="um-avatar">{initial}</div>
          <div className="um-identity">
            <span className="um-name">{firstName} {lastName}</span>
            <span className="um-email">{email}</span>
          </div>
          <div className="um-close" onClick={handleToggleUserMenu}>
            <span className="material-symbols-outlined">close</span>
          </div>
        </div>

        <div className="um-divider" />

        {/* ── Acciones ── */}
        <nav className="um-actions">
          <Link
            to="/forgot-password"
            className="um-action-link"
            onClick={handleToggleUserMenu}
          >
            <div className="um-action-ico">
              <div className="material-symbols-outlined">lock_reset</div>
            </div>
            <div className="um-action-label">Cambiar contraseña</div>
          </Link>

          <button className="um-action-link um-logout" onClick={handleLogout}>
            <div className="um-action-ico um-action-ico--red">
              <div className="material-symbols-outlined">logout</div>
            </div>
            <div className="um-action-label">Cerrar sesión</div>
          </button>
        </nav>

      </div>
    </>
  );
}

export default UserMenu;
