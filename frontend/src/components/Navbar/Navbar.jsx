import { useEffect, useState } from "react";
import CartWidget from "./CartWidget";
import "./NavbarStyle.css";
import { NavLink } from "react-router-dom";
import { restyleCategory } from "../../helpers/helpers";

function Navbar() {
  const [clicked, setClicked] = useState(false);

  const handleClicked = () => {
    setClicked(!clicked);
  };

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const allCategories = [
      "Champagnes",
      "Sparkling Wines",
      "Still Wines",
      "Spirits",
    ];
    setCategories(allCategories);
  }, []);

  let uniqueCategories = [...new Set(categories)].sort();

  return (
    <>
      <nav className="navbar__items">
        <NavLink to="/" className="navbar__logo">
          <h1 className="logo">MH Store </h1>
          <span class="material-symbols-outlined">liquor</span>
        </NavLink>
        <div className="navbar__icons" onClick={handleClicked}>
          {clicked ? (
            <span class="material-symbols-outlined">close</span>
          ) : (
            <span class="material-symbols-outlined">menu</span>
          )}
        </div>
        <ul className={clicked ? "navbar__menu active" : "navbar__menu"}>
          <li>
            <NavLink to={`/category/`}>Home</NavLink>
          </li>
          <li>
            <NavLink to={`/category/`}>Cronicas</NavLink>
          </li>
          <li>
            <NavLink to={`/category/`}>Prode</NavLink>
          </li>
          <li>
            <NavLink to={`/category/`}>Chachos</NavLink>
          </li>
          <li>
            <NavLink to={`/category/`}>Admin</NavLink>
          </li>
          <li>
            <CartWidget />
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
