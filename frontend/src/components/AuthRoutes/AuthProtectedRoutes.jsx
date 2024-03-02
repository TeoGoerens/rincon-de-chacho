//Import React & Hooks
import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

//Import CSS & styles

//Import helpers

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { logoutUserAction } from "../../redux/slices/users/usersSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const AuthProtectedRoutes = () => {
  //Instance of location
  const location = useLocation();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Navigate const creation
  const navigate = useNavigate();

  //Select state from votes store
  const userStoreData = useSelector((store) => store.users);
  const userAuth = userStoreData?.userAuth;

  //Select date from last login
  const last_login = new Date(
    userAuth?.last_login || userAuth?.userToDisplay?.last_login
  );

  //Calculate when credentials will expire based on last login
  const expired_credentials_date = new Date(last_login);
  expired_credentials_date.setDate(last_login.getDate() + 1);

  //Select current date to compare it with credentials' expiry date
  const rightNow = new Date();

  //Compare both dates
  if (rightNow > expired_credentials_date) {
    console.log("Te pasaste");
    dispatch(logoutUserAction());
    navigate("/");
  }

  return userAuth ? (
    <Outlet />
  ) : (
    <Navigate to="/" state={{ from: location }} replace />
  );
};

export default AuthProtectedRoutes;
