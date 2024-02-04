import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "../../../redux/slices/users/usersSlices";
import { Navigate } from "react-router-dom";

const formSchema = Yup.object({
  email: Yup.string().required("Por favor chacal escribi tu email"),
  password: Yup.string().required("Por favor chacal escribi tu contraseña"),
});

const UserLogin = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(loginUserAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.users);
  const { appError, serverError, userAuth } = storeData;

  if (userAuth) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <h2>Iniciá sesión</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Email</label>
        <input
          value={formik.values.email}
          onChange={formik.handleChange("email")}
          onBlur={formik.handleBlur("email")}
          type="email"
          name="email"
        ></input>
        <div>{formik.touched.email && formik.errors.email}</div>

        <label>Password</label>
        <input
          value={formik.values.password}
          onChange={formik.handleChange("password")}
          onBlur={formik.handleBlur("password")}
          type="password"
          name="password"
        ></input>
        <div>{formik.touched.password && formik.errors.password}</div>

        <button type="submit">Iniciar sesión</button>
      </form>
    </>
  );
};

export default UserLogin;
