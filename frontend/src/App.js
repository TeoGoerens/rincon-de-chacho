import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "../src/components/Layout/ScrollToTop/ScrollToTop";
import Navbar from "./components/Layout/Navbar/Navbar";
import UserRegister from "./components/Users/Register/userRegister";
import UserLogin from "./components/Users/Login/userLogin";
import ChachosRoutes from "./components/Chachos/ChachosRoutes";
import AdminRoutes from "./components/Admin/AdminRoutes";
import Home from "./components/Home/Home";
import AuthProtectedRoutes from "./components/AuthRoutes/AuthProtectedRoutes";
import AdminProtectedRoutes from "./components/AuthRoutes/AdminProtectedRoutes";
import PhotoGallery from "./components/PhotoGallery/PhotoGallery";
import ForgotPassword from "./components/Users/PasswordManagement/ForgotPassword";
import ResetPassword from "./components/Users/PasswordManagement/ResetPassword";
import PodridaRoutes from "./components/Podrida/PodridaRoutes";
import CronicaRoutes from "./components/Cronicas/CronicaRoutes";
import ProdeRoutes from "./components/Prode/ProdeRoutes.jsx";

/* --------------- REACT QUERY --------------- */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
/* --------------- SUPPORTING LIBRARIES --------------- */
import { register } from "swiper/element/bundle";
import "swiper/element/bundle";
import "swiper/css";
import "swiper/css/pagination";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/* --------------- HELPERS --------------- */
import { baseURL } from "./helpers/baseURL.js";

register();
/* --------------- QUERY CLIENT --------------- */
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* React Query Devtools siempre está montado */}
      {baseURL === "http://localhost:8080" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <ToastContainer />

        <Routes>
          {/* Public routes */}
          <Route path="/" Component={UserLogin} />
          <Route path="/register" Component={UserRegister} />
          <Route path="/forgot-password" Component={ForgotPassword} />
          <Route path="/reset-password/:resetToken" Component={ResetPassword} />

          {/* Auth protected routes */}
          <Route Component={AuthProtectedRoutes}>
            <Route path="/home" Component={Home} />
            <Route path="/photo-gallery" Component={PhotoGallery} />
            <Route path="/podrida/*" Component={PodridaRoutes} />
            <Route path="/prode/*" Component={ProdeRoutes} />
            <Route path="/cronicas/*" Component={CronicaRoutes} />
            <Route path="/chachos/*" Component={ChachosRoutes} />

            {/* Admin protected routes */}
            <Route element={<AdminProtectedRoutes />}>
              <Route path="/admin/*" element={<AdminRoutes />} />
            </Route>
          </Route>
          {/* Catch all remaining routes */}
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
