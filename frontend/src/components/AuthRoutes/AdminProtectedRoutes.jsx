//Import React & Hooks
import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";

//Import CSS & styles

//Import helpers

//Import components

//Import Redux
import { useSelector } from "react-redux";

//----------------------------------------
//COMPONENT
//----------------------------------------

const AdminProtectedRoutes = () => {
  //Select state from votes store
  const userStoreData = useSelector((store) => store.users);
  const isAdmin = userStoreData?.isAdmin;

  //Instance of location
  const location = useLocation();

  return isAdmin ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default AdminProtectedRoutes;
