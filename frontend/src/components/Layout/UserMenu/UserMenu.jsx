//Import React & Hooks
import { Link, useNavigate } from "react-router-dom";

//Import components
import { logoutUserAction } from "../../../redux/slices/users/usersSlices";
import SoonTag from "../SoonTag/SoonTag";

//Import CSS & styles
import "./UserMenuStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

function UserMenu({ userMenuOpen, handleToggleUserMenu }) {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Navigate const creation
  const navigate = useNavigate();

  //Select state from tournament rounds store
  const storeData = useSelector((store) => store.users);
  const { userAuth } = storeData;

  //Define handleLogout function
  const handleLogout = () => {
    dispatch(logoutUserAction());
  };

  //Define handleLogoutFunctions
  const handleLogoutFunctions = () => {
    handleLogout();
    handleToggleUserMenu();
    navigate("/");
  };

  return (
    <section className={`user-menu ${!userMenuOpen ? "user-menu-active" : ""}`}>
      <div className="user-menu-title">
        <span
          className="material-symbols-outlined user-menu-close-btn"
          onClick={handleToggleUserMenu}
        >
          close
        </span>
        <p>
          {userAuth?.userToDisplay === undefined
            ? `${userAuth?.first_name} ${userAuth?.last_name}`
            : `${userAuth?.userToDisplay?.first_name} ${userAuth?.userToDisplay?.last_name}`}
        </p>
        <p>
          {userAuth?.userToDisplay === undefined
            ? `${userAuth?.email}`
            : `${userAuth?.userToDisplay?.email}`}
        </p>
      </div>

      <div className="user-menu-options">
        <Link to="/" onClick={handleToggleUserMenu}>
          <span className="material-symbols-outlined">account_circle</span>
          <p>Mi perfil</p>
          <SoonTag />
        </Link>
        <Link to="/" onClick={handleToggleUserMenu}>
          <span className="material-symbols-outlined">lock</span>
          <p>Cambiar contraseña</p>
        </Link>
        <Link to="/" onClick={handleToggleUserMenu}>
          <span className="material-symbols-outlined">favorite</span>
          <p>Mis favoritos</p>
          <SoonTag />
        </Link>
        <Link to="/" onClick={handleToggleUserMenu}>
          <span className="material-symbols-outlined">star</span>
          <p>Destacados</p>
          <SoonTag />
        </Link>
      </div>

      <div className="user-menu-social">
        <p>Seguime en redes</p>
        <div className="user-menu-social-icons">
          <Link
            to="https://www.instagram.com/rafael_chacho/"
            target="_blank"
            onClick={handleToggleUserMenu}
          >
            <i className="fa-brands fa-instagram"></i>
          </Link>
          <Link
            to="https://www.linkedin.com/in/rafael-giaccio-647599117/?originalSubdomain=ar"
            target="_blank"
            onClick={handleToggleUserMenu}
          >
            <i className="fa-brands fa-linkedin-in"></i>
          </Link>
          <Link
            to="https://twitter.com/rafael_chacho"
            target="_blank"
            onClick={handleToggleUserMenu}
          >
            <i className="fa-brands fa-x-twitter"></i>
          </Link>
        </div>
      </div>

      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogoutFunctions}>
          <span className="material-symbols-outlined">logout</span>
          <p>Logout</p>
        </button>
      </div>
    </section>
  );
}

export default UserMenu;
