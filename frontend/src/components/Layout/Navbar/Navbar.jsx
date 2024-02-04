//Import React & Hooks
import { useState } from "react";
import { Link } from "react-router-dom";

//Import components
import { logoutUserAction } from "../../../redux/slices/users/usersSlices";

//Import CSS & styles
import "./NavbarStyle.css";
import * as NavbarUtils from "./NavbarUtils";

//Import Redux
import { useDispatch, useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

const Navbar = () => {
  return (
    <nav>
      <ul>
        <li>home</li>
        <li>teo</li>
        <li>capo</li>
      </ul>
    </nav>
  );
};

export default Navbar;
