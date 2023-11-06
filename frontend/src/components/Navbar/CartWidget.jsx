import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { CartContext } from "../../context/CartContext";

function CartWidget() {
  const { cartInformation } = useContext(CartContext);
  return (
    <NavLink to="/cart">
      <span className="material-symbols-outlined">shopping_cart</span>
      <strong>{cartInformation()}</strong>
    </NavLink>
  );
}

export default CartWidget;
