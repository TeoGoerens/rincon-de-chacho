//Import React & Hooks
import { useState } from "react";
import { Link } from "react-router-dom";

//Import helpers

//Import components
import Sidebar from "../Sidebar/Sidebar";
import UserMenu from "../UserMenu/UserMenu";
import logoSource from "../../../assets/images/logo.jpg";

//Import CSS & styles
import "./NavbarStyle.css";

//Import Redux
import { useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

const Navbar = () => {
  //Select state from tournament rounds store
  const storeData = useSelector((store) => store.users);
  const { userAuth } = storeData;

  //Define Sidebar Open
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  //Define User Menu Open
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const handleToggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      <nav>
        <div className="logo-container">
          {userAuth ? (
            <span
              className="material-symbols-outlined menu-btn"
              onClick={handleToggleSidebar}
            >
              menu
            </span>
          ) : null}

          <img src={logoSource} alt="Logo" className="logo-img" />
          <p className="logo-text">
            El Rincón de <span>Chacho</span>
          </p>
        </div>
        <div className="menu-container">
          {userAuth ? (
            <div
              className="user-credentials-container"
              onClick={handleToggleUserMenu}
            >
              <img
                src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                alt="Usuario"
                className="user-img"
              />
              <span>
                {userAuth.userToDisplay === undefined
                  ? userAuth.first_name
                  : userAuth.userToDisplay.first_name}
              </span>
            </div>
          ) : (
            <div className="credentials-btn-container">
              <Link to="/" className="nav-login-btn">
                Login
              </Link>
              <Link to="/register" className="nav-register-btn">
                Registrate
              </Link>
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
