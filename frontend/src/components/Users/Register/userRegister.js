import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { registerUserAction } from "../../../redux/slices/users/usersSlices";
import { Navigate } from "react-router-dom";

const formSchema = Yup.object({
  first_name: Yup.string().required("Por favor chacal escribi tu nombre"),
  last_name: Yup.string().required("Por favor chacal escribi tu apellido"),
  email: Yup.string().required("Por favor chacal escribi tu email"),
  password: Yup.string().required("Por favor chacal escribi tu contraseña"),
});

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

  if (registered) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <h2>Registrate</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Nombre</label>
        <input
          value={formik.values.first_name}
          onChange={formik.handleChange("first_name")}
          onBlur={formik.handleBlur("first_name")}
          type="text"
          name="first_name"
        ></input>
        <div>{formik.touched.first_name && formik.errors.first_name}</div>

        <label>Apellido</label>
        <input
          value={formik.values.last_name}
          onChange={formik.handleChange("last_name")}
          onBlur={formik.handleBlur("last_name")}
          type="text"
          name="last_name"
        ></input>
        <div>{formik.touched.last_name && formik.errors.last_name}</div>

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

        <button type="submit">Registrarse</button>
      </form>
    </>
  );
};

export default UserRegister;
