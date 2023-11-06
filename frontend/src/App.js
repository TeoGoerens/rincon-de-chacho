import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import CartContainer from "./components/Cart/CartContainer";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/cart" element={<CartContainer />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
