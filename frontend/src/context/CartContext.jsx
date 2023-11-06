import { createContext, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity) => {
    const newItem = { ...product, quantity };
    const initialCart = [...cart];
    const currentItem = initialCart.find((item) => item.id === newItem.id);

    if (currentItem) {
      currentItem.quantity += quantity;
      setCart(initialCart);
    } else {
      setCart([...cart, newItem]);
    }
  };

  const cartInformation = () => {
    return cart.reduce((acc, prod) => acc + prod.quantity, 0);
  };

  const totalCartAmount = () => {
    return cart.reduce((acc, prod) => acc + prod.price * prod.quantity, 0);
  };

  const emptyCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        cartInformation,
        totalCartAmount,
        emptyCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
