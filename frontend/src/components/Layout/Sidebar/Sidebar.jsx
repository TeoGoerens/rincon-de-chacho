//Import React & Hooks
import { useState } from "react";
import { Link } from "react-router-dom";

//Import components
import { logoutUserAction } from "../../../redux/slices/users/usersSlices";

//Import CSS & styles
import "./SidebarStyle.css";
import * as SidebarUtils from "./SidebarUtils";

//Import Redux
import { useDispatch, useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

function Sidebar() {
  const handleExpandButtonClick = () => {
    SidebarUtils.handleExpandButtonClick();
  };

  const handleLinkClick = (e) => {
    SidebarUtils.handleLinkClick(e.target);
  };

  /*   const [openMenu, setOpenMenu] = useState(false);

  const dispatch = useDispatch();

  const userData = useSelector((state) => state.users);
  const userAuth = userData.userAuth;
  const isAdmin = userData.isAdmin;

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
  }; */

  return (
    <nav className="sidebar">
      <div className="sidebar-top-wrapper">
        <div className="sidebar-top">
          <Link href="#" className="logo__wrapper">
            <img src="" alt="Logo" className="logo-small" />
            <span className="hide company-name">El rincon de Chacho</span>
          </Link>
        </div>
        <button
          className="expand-btn"
          type="button"
          onClick={handleExpandButtonClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-labelledby="exp-btn"
            role="img"
          >
            <title id="exp-btn">Expand/Collapse Menu</title>
            <path
              d="M6.00979 2.72L10.3565 7.06667C10.8698 7.58 10.8698 8.42 10.3565 8.93333L6.00979 13.28"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="sidebar-links">
        <ul>
          <li>
            <Link to="#dashboard" title="Dashboard" class="tooltip active">
              <span class="material-symbols-outlined">home</span>
              <span class="link hide">Home</span>
              <span class="tooltip__content">Home</span>
            </Link>
          </li>
          <li>
            <Link to="#market-overview" class="tooltip">
              <span class="material-symbols-outlined">stadia_controller</span>
              <span class="link hide">Prode</span>
              <span class="tooltip__content">Prode</span>
            </Link>
          </li>
          <li>
            <Link to="#analytics" title="Analytics" class="tooltip">
              <span class="material-symbols-outlined">edit_note</span>
              <span class="link hide">Cronicas</span>
              <span class="tooltip__content">Cronicas</span>
            </Link>
          </li>

          <li>
            <Link to="#reports" title="Reports" class="tooltip">
              <span class="material-symbols-outlined">sports_soccer</span>
              <span class="link hide">Chachos</span>
              <span class="tooltip__content">Chachos</span>
            </Link>
          </li>
          <li>
            <Link to="#industries" title="Industries" class="tooltip">
              <span class="material-symbols-outlined">
                admin_panel_settings
              </span>
              <span class="link hide">Admin</span>
              <span class="tooltip__content">Admin</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;
