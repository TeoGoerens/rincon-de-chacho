import "./App.css";
//import Navbar from "./components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Layout/Navbar/Navbar";
import Sidebar from "./components/Layout/Sidebar/Sidebar";
import UserRegister from "./components/Users/Register/userRegister";
import UserLogin from "./components/Users/Login/userLogin";
import AdminRoutes from "./components/Admin/AdminRoutes";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" />
        <Route path="/login" Component={UserLogin} />
        <Route path="/register" Component={UserRegister} />
        <Route path="/home" />
        <Route path="/prode" />
        <Route path="/cronicas" />
        <Route path="/admin/*" Component={AdminRoutes} />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
