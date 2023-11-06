import React, { useContext } from "react";
import "./CartContainerStyle.css";
import { CartContext } from "../../context/CartContext";
import { numberFormatting } from "../../helpers/helpers";
import { Link } from "react-router-dom";

const CartContainer = () => {
  const { cart, totalCartAmount, emptyCart } = useContext(CartContext);

  const handleEmptyCart = () => {
    emptyCart();
  };

  return (
    <div className="CartContainer">
      <h1>Cart Details</h1>
      <div className="CartContainer__Products">
        {cart.map((prod) => (
          <div className="CartContainer__ProductDetail" key={prod.id}>
            <div className="CartContainer__ProductDetail__ImageContainer">
              <img src={prod.image} alt={prod.name} />
            </div>
            <h4 className="CartContainer__ProductDetail__ProductName">
              {prod.name}
            </h4>
            <p>Quantity: {prod.quantity}</p>
            <p>Unit Price: ${numberFormatting(prod.price)}</p>
            <p>Total Price: ${numberFormatting(prod.quantity * prod.price)}</p>
          </div>
        ))}
      </div>

      {cart.length > 0 ? (
        <>
          <h3 className="CartContainer__TotalCart">
            Total Cart: ${numberFormatting(totalCartAmount())}
          </h3>
          <button className="CartButton" onClick={handleEmptyCart}>
            Empty Cart
          </button>

          <Link className="CartButton" to="/checkout">
            Purchase
          </Link>
        </>
      ) : (
        <h3 className="CartContainer__ShopNow">
          Start shopping <Link to="/">now...</Link>
        </h3>
      )}
    </div>
  );
};

export default CartContainer;
