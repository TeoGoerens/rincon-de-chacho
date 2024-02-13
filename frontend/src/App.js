import "./App.css";
//import Navbar from "./components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Layout/Navbar/Navbar";
import UserRegister from "./components/Users/Register/userRegister";
import UserLogin from "./components/Users/Login/userLogin";
import ChachosRoutes from "./components/Chachos/ChachosRoutes";
import AdminRoutes from "./components/Admin/AdminRoutes";
import Home from "./components/Home/Home";
import AuthProtectedRoutes from "./components/AuthRoutes/AuthProtectedRoutes";
import AdminProtectedRoutes from "./components/AuthRoutes/AdminProtectedRoutes";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route path="/" Component={UserLogin} />
        <Route path="/register" Component={UserRegister} />

        {/* Auth protected routes */}
        <Route Component={AuthProtectedRoutes}>
          <Route path="/home" Component={Home} />
          <Route path="/prode" />
          <Route path="/cronicas" />
          <Route path="/chachos/*" Component={ChachosRoutes} />

          {/* Admin protected routes */}
          <Route Component={AdminProtectedRoutes}>
            <Route path="/admin/*" Component={AdminRoutes} />
          </Route>
        </Route>
        {/* Catch all remaining routes */}
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
