//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";

//Import CSS & styles
import "./userRegisterStyles.css";

//Import components
import imageRegisterSource from "../../../assets/photos/chacho-blow.png";

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  registerUserAction,
  resetAllUsersErrorsAction,
} from "../../../redux/slices/users/usersSlices";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";
const formSchema = Yup.object({
  first_name: Yup.string().required("Por favor chacal escribi tu nombre"),
  last_name: Yup.string().required("Por favor chacal escribi tu apellido"),
  email: Yup.string().required("Por favor chacal escribi tu email"),
  password: Yup.string().required("Por favor chacal escribi tu contraseña"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const UserRegister = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(registerUserAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.users);
  const { appError, serverError, registered } = storeData;

  //Reset all errors and success messages once the component is render to avoid carry forward from other components
  useEffect(() => {
    dispatch(resetAllUsersErrorsAction());
  }, [dispatch]);

  if (registered) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container register-page-container">
      {appError || serverError ? (
        <h5 className="message-error">
          {appError} {serverError}
        </h5>
      ) : null}

      <div className="register-image-container">
        <img
          src={imageRegisterSource}
          alt="Register"
          className="register-image"
        />
      </div>

      <div className="register-text">
        <h1 className="register-text-brand">
          El Rincón de <span>Chacho</span>
        </h1>
        <h2>Registrate ahora mismo, chacal</h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={formik.values.first_name}
              onChange={formik.handleChange("first_name")}
              onBlur={formik.handleBlur("first_name")}
              type="text"
              name="first_name"
            ></input>
          </div>
          <div className="message-error">
            {formik.touched.first_name && formik.errors.first_name}
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input
              value={formik.values.last_name}
              onChange={formik.handleChange("last_name")}
              onBlur={formik.handleBlur("last_name")}
              type="text"
              name="last_name"
            ></input>
          </div>

          <div className="message-error">
            {formik.touched.last_name && formik.errors.last_name}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              value={formik.values.email}
              onChange={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
              type="email"
              name="email"
            ></input>
          </div>

          <div className="message-error">
            {formik.touched.email && formik.errors.email}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              value={formik.values.password}
              onChange={formik.handleChange("password")}
              onBlur={formik.handleBlur("password")}
              type="password"
              name="password"
            ></input>
          </div>

          <div className="message-error">
            {formik.touched.password && formik.errors.password}
          </div>

          <button type="submit">Registrarse</button>
        </form>
      </div>
    </div>
  );
};

export default UserRegister;
